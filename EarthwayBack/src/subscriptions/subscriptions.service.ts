import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StripeProvider } from '../config/stripe.provider';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { mapStripeError } from '../common/stripe-error.util';

// Tier → price in cents (monthly), only used as fallback display
export const TIER_PRICES: Record<string, number> = {
  basic: 500,    // 5€
  premium: 1000, // 10€
  vip: 2000,     // 20€
};

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailService: MailService,
    private stripeProvider: StripeProvider,
  ) {}

  // ─── List available tiers ─────────────────────────────────────────────────

  getAvailableTiers() {
    return [
      {
        id: 'basic',
        name: 'Essentiel',
        price: 5,
        currency: 'EUR',
        interval: 'month',
        stripePriceId: this.config.get<string>('STRIPE_PRICE_BASIC'),
        features: [
          'Suivi de votre impact carbone',
          'Accès aux actualités environnementales',
          '1 arbre planté par mois',
          'Newsletter mensuelle',
        ],
      },
      {
        id: 'premium',
        name: 'Engagé',
        price: 10,
        currency: 'EUR',
        interval: 'month',
        stripePriceId: this.config.get<string>('STRIPE_PRICE_PREMIUM'),
        features: [
          'Tout ce qui est inclus dans Essentiel',
          '3 arbres plantés par mois',
          'Contribution à la restauration des coraux',
          'Tableau de bord impact détaillé',
          'Badge profil engagé',
        ],
      },
      {
        id: 'vip',
        name: 'Ambassadeur',
        price: 20,
        currency: 'EUR',
        interval: 'month',
        stripePriceId: this.config.get<string>('STRIPE_PRICE_VIP'),
        features: [
          'Tout ce qui est inclus dans Engagé',
          '10 arbres plantés par mois',
          'Protection des pollinisateurs',
          'Rapport d\'impact trimestriel personnalisé',
          'Accès aux innovations en avant-première',
          'Badge ambassadeur',
        ],
      },
    ];
  }

  // ─── Get my subscription ──────────────────────────────────────────────────

  async getMySubscription(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });
    return user?.subscription ?? null;
  }

  // ─── Create subscription (Stripe Checkout) ────────────────────────────────

  async createSubscription(userId: number, dto: CreateSubscriptionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable.');

    // Check if already subscribed
    if (user.subscriptionId) {
      const existing = await this.prisma.subscription.findUnique({
        where: { id: user.subscriptionId },
      });
      if (existing && existing.status === SubscriptionStatus.active) {
        throw new BadRequestException('Vous avez déjà un abonnement actif.');
      }
    }

    // Get or create Stripe customer
    let stripeCustomerId = await this.getOrCreateStripeCustomer(user);

    try {
      // Create Stripe Checkout Session
      const session = await this.stripeProvider.checkout.sessions.create({
        mode: 'subscription',
        customer: stripeCustomerId,
        line_items: [{ price: dto.stripePriceId, quantity: 1 }],
        success_url: `${this.config.get('FRONTEND_URL')}/subscriptions?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${this.config.get('FRONTEND_URL')}/subscriptions?checkout=cancelled`,
        metadata: {
          userId: String(userId),
          tier: dto.tier,
        },
        subscription_data: {
          metadata: {
            userId: String(userId),
            tier: dto.tier,
          },
        },
      });

      return { checkoutUrl: session.url, sessionId: session.id };
    } catch (error) {
      const stripeError = mapStripeError(error);
      this.logger.error(`Stripe checkout creation failed: ${stripeError.code} - ${stripeError.message}`);
      throw new BadRequestException({
        code: stripeError.code,
        message: stripeError.message,
      });
    }

  }

  // ─── Change subscription tier (Stripe source of truth) ───────────────────
  // Upgrade: immediate prorated invoice via create_prorations.
  // Downgrade: price change applied at the end of the current billing cycle with
  // proration_behavior: 'none', so no immediate refund and no DB mutation here.
  async upgradeSubscriptionTier(userId: number, targetTier: SubscriptionTier | string) {
    const tier = targetTier as SubscriptionTier;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user?.subscription || !user.subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe associé à votre compte.');
    }

    const newPriceId = this.getStripePriceIdForTier(tier);
    if (!newPriceId) {
      throw new BadRequestException('Ce tier n’est pas disponible pour la souscription.');
    }

    const currentSubscription = await this.stripeProvider.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId,
    );
    const currentItem = currentSubscription.items.data[0];

    if (!currentItem) {
      throw new BadRequestException('Aucun item de souscription Stripe trouvé pour cet abonnement.');
    }

    if (currentItem.price.id === newPriceId) {
      return {
        status: 'no_change',
        message: 'Vous êtes déjà sur ce tier. Aucune modification n’a été appliquée.',
      };
    }

    await this.stripeProvider.subscriptions.update(user.subscription.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });

    return {
      status: 'updated',
      message: 'Votre abonnement a été mis à niveau. La différence a été calculée et facturée au prorata.',
    };
  }

  async downgradeSubscriptionTier(userId: number, targetTier: SubscriptionTier | string) {
    const tier = targetTier as SubscriptionTier;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user?.subscription || !user.subscription.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe associé à votre compte.');
    }

    const newPriceId = this.getStripePriceIdForTier(tier);
    if (!newPriceId) {
      throw new BadRequestException('Ce tier n’est pas disponible pour la souscription.');
    }

    const currentSubscription = await this.stripeProvider.subscriptions.retrieve(
      user.subscription.stripeSubscriptionId,
    );
    const currentItem = currentSubscription.items.data[0];

    if (!currentItem) {
      throw new BadRequestException('Aucun item de souscription Stripe trouvé pour cet abonnement.');
    }

    if (currentItem.price.id === newPriceId) {
      return {
        status: 'no_change',
        message: 'Vous êtes déjà sur ce tier. Aucune modification n’a été appliquée.',
      };
    }

    await this.stripeProvider.subscriptions.update(user.subscription.stripeSubscriptionId, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: 'none',
    });

    return {
      status: 'scheduled',
      message: 'Votre changement de tier sera appliqué à la fin de la période courante. Aucun remboursement immédiat n’est effectué.',
    };
  }

  // ─── Cancel subscription ──────────────────────────────────────────────────

  async cancelSubscription(userId: number, subscriptionId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user?.subscription || user.subscription.id !== subscriptionId) {
      throw new NotFoundException('Abonnement introuvable.');
    }

    const sub = user.subscription;
    if (!sub.stripeSubscriptionId) {
      throw new BadRequestException('Aucun abonnement Stripe associé.');
    }

    // Cancel at period end (not immediately) for better UX
    await this.stripeProvider.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    const updated = await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        canceledAt: new Date(),
        status: SubscriptionStatus.canceled,
      },
    });

    try {
      await this.mailService.sendSubscriptionCancellationEmail(
        user.email,
        user.firstName,
        updated.currentPeriodEnd,
      );
    } catch (err) {
      this.logger.warn(`Failed to send cancellation email: ${(err as Error).message}`);
    }

    return updated;
  }

  // ─── Sync subscription from Stripe webhook ────────────────────────────────

  async syncSubscriptionFromStripe(
    stripeSubscriptionId: string,
    stripeCustomerId: string,
    status: string,
    tier: string,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    canceledAt: Date | null,
    userId?: number,
  ) {
    const stripeStatus = this.mapStripeStatus(status);

    const existing = await this.prisma.subscription.findUnique({
      where: { stripeSubscriptionId },
    });

    if (existing) {
      return this.prisma.subscription.update({
        where: { stripeSubscriptionId },
        data: {
          status: stripeStatus,
          currentPeriodStart,
          currentPeriodEnd,
          canceledAt,
          tier: tier as SubscriptionTier,
        },
      });
    }

    // Create new subscription record
    const tierEnum = tier as SubscriptionTier;
    const price = TIER_PRICES[tier] ?? 500;

    const subscription = await this.prisma.subscription.create({
      data: {
        name: tier,
        price: price / 100,
        duration: 30,
        stripeCustomerId,
        stripeSubscriptionId,
        tier: tierEnum,
        status: stripeStatus,
        currentPeriodStart,
        currentPeriodEnd,
        canceledAt,
      },
    });

    // Link to user if userId provided
    if (userId) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { subscriptionId: subscription.id },
      });
    }

    return subscription;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async getOrCreateStripeCustomer(user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    subscriptionId?: number | null;
  }): Promise<string> {
    if (user.subscriptionId) {
      const sub = await this.prisma.subscription.findUnique({
        where: { id: user.subscriptionId },
      });
      if (sub?.stripeCustomerId) return sub.stripeCustomerId;
    }

    const customer = await this.stripeProvider.customers.create({
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
      metadata: { userId: String(user.id) },
    });

    return customer.id;
  }

  private getStripePriceIdForTier(tier: SubscriptionTier | string): string | null {
    const priceKey = `STRIPE_PRICE_${String(tier).toUpperCase()}`;
    const priceId = this.config.get<string>(priceKey);
    return priceId || null;
  }

  private mapStripeStatus(status: string): SubscriptionStatus {
    const map: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.active,
      canceled: SubscriptionStatus.canceled,
      past_due: SubscriptionStatus.past_due,
      incomplete: SubscriptionStatus.incomplete,
      incomplete_expired: SubscriptionStatus.canceled,
      trialing: SubscriptionStatus.active,
      unpaid: SubscriptionStatus.past_due,
    };
    return map[status] ?? SubscriptionStatus.active;
  }
}
