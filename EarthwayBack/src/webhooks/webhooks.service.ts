import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { StripeProvider } from '../config/stripe.provider';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DonationsService } from '../donations/donations.service';
import { ImpactService } from '../impact/impact.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stripeProvider: StripeProvider,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly donationsService: DonationsService,
    private readonly impactService: ImpactService,
  ) {}

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      throw new BadRequestException('Webhook secret not configured');
    }
    try {
      return this.stripeProvider.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }

  async handleEvent(event: Stripe.Event): Promise<void> {
    // Idempotency: skip already processed events
    const existing = await this.prisma.webhookLog.findUnique({
      where: { stripeEventId: event.id },
    });
    if (existing?.status === 'processed') {
      this.logger.log(`Skipping already processed event ${event.id}`);
      return;
    }

    // Persist log entry (pending)
    await this.prisma.webhookLog.upsert({
      where: { stripeEventId: event.id },
      create: {
        stripeEventId: event.id,
        eventType: event.type,
        status: 'pending',
        payload: JSON.stringify(event),
      },
      update: {
        status: 'pending',
      },
    });

    try {
      await this.dispatch(event);

      // Mark as processed
      await this.prisma.webhookLog.update({
        where: { stripeEventId: event.id },
        data: { status: 'processed', processedAt: new Date() },
      });
    } catch (err) {
      this.logger.error(`Failed to process event ${event.id}: ${(err as Error).message}`);
      await this.prisma.webhookLog.update({
        where: { stripeEventId: event.id },
        data: { status: 'failed', errorMessage: (err as Error).message },
      });
      throw err;
    }
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      // ── Subscription events ──────────────────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        const tier = (sub.metadata?.tier as string) ?? 'basic';
        const customerId = sub.customer as string;

        await this.subscriptionsService.syncSubscriptionFromStripe(
          sub.id,
          customerId,
          sub.status,
          tier,
          new Date(((sub as any).current_period_start as number) * 1000),
          new Date(((sub as any).current_period_end as number) * 1000),
          sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        );

        // Refresh impact for the user linked to this subscription
        const user = await this.prisma.user.findFirst({
          where: {
            subscription: {
              stripeSubscriptionId: sub.id,
            },
          },
        });
        if (user) {
          await this.impactService.recalculateImpact(user.id);
        }
        break;
      }

      // ── Payment events ───────────────────────────────────────────────────
      case 'payment_intent.succeeded': {
        const pi = event.data.object as Stripe.PaymentIntent;
        const donation = await this.prisma.donation.findUnique({
          where: { stripePaymentIntentId: pi.id },
        });
        if (donation) {
          await this.donationsService.syncDonationFromStripe(pi.id, 'succeeded');
          await this.impactService.recalculateImpact(donation.userId);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as Stripe.PaymentIntent;
        await this.donationsService.syncDonationFromStripe(pi.id, 'failed');
        break;
      }

      // ── Checkout session completed ────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === 'payment' && session.payment_intent) {
          const piId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent.id;
          const donation = await this.prisma.donation.findUnique({
            where: { stripePaymentIntentId: piId },
          });
          if (donation) {
            await this.donationsService.syncDonationFromStripe(piId, 'succeeded');
            await this.impactService.recalculateImpact(donation.userId);
          }
        }
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event type: ${event.type}`);
    }
  }
}
