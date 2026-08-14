import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { StripeProvider } from '../config/stripe.provider';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DonationsService } from '../donations/donations.service';
import { ImpactService } from '../impact/impact.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly stripeProvider: StripeProvider,
    @InjectQueue('stripe-events') private readonly webhooksQueue: Queue,
    private readonly subscriptionsService: SubscriptionsService,
    private readonly donationsService: DonationsService,
    private readonly impactService: ImpactService,
    private readonly mailService: MailService,
  ) {}

  constructEvent(rawBody: Buffer, signature?: string): Stripe.Event {
    if (!signature) {
      throw new BadRequestException('Missing Stripe signature header');
    }

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

  async handleEvent(event: Stripe.Event): Promise<{ duplicate: boolean }> {
    const existing = await this.prisma.webhookLog.findUnique({
      where: { eventId: event.id },
    });

    if (existing) {
      this.logger.log(
        `Webhook duplicate ignored eventId=${event.id} type=${event.type} status=${existing.status}`,
      );
      return { duplicate: true };
    }

    try {
      await this.prisma.webhookLog.create({
        data: {
          eventId: event.id,
          type: event.type,
          status: 'received',
          payload: event as unknown as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        this.logger.log(`Webhook duplicate ignored eventId=${event.id} type=${event.type}`);
        return { duplicate: true };
      }
      throw error;
    }

    await this.webhooksQueue.add('process-event', { eventId: event.id });

    this.logger.log(`Webhook queued eventId=${event.id} type=${event.type}`);
    return { duplicate: false };
  }

  async queueEvent(event: Stripe.Event): Promise<{ duplicate: boolean }> {
    return this.handleEvent(event);
  }

  async processQueuedEvent(eventId: string): Promise<void> {
    const log = await this.prisma.webhookLog.findUnique({ where: { eventId } });
    if (!log) {
      this.logger.warn(`Webhook log not found for eventId=${eventId}`);
      return;
    }

    if (log.status === 'processed') {
      this.logger.log(`Webhook already processed eventId=${eventId}`);
      return;
    }

    const event = log.payload as unknown as Stripe.Event;
    if (!event || !event.id || !event.type) {
      this.logger.error(`Webhook payload invalid eventId=${eventId}`);
      await this.markWebhookFailed(eventId);
      return;
    }

    this.logger.log(`Webhook processing start eventId=${event.id} type=${event.type}`);

    try {
      await this.dispatch(event);

      await this.prisma.webhookLog.update({
        where: { eventId: event.id },
        data: { status: 'processed' },
      });

      this.logger.log(`Webhook processing done eventId=${event.id} type=${event.type}`);
    } catch (err) {
      this.logger.error(
        `Webhook processing failed eventId=${event.id} type=${event.type} error=${(err as Error).message}`,
      );
      throw err;
    }
  }

  async markWebhookFailed(eventId: string): Promise<void> {
    await this.prisma.webhookLog.update({
      where: { eventId },
      data: { status: 'failed' },
    });
  }

  private async dispatch(event: Stripe.Event): Promise<void> {
    switch (event.type) {
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

      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const invoiceAny = invoice as any;
        const subscriptionId =
          typeof invoiceAny.subscription === 'string'
            ? invoiceAny.subscription
            : invoiceAny.subscription?.id;

        if (!subscriptionId) {
          this.logger.warn(`Invoice event without subscription eventId=${event.id} type=${event.type}`);
          break;
        }

        const sub = await this.stripeProvider.subscriptions.retrieve(subscriptionId);
        const tier = (sub.metadata?.tier as string) ?? 'basic';
        const customerId = sub.customer as string;
        const mappedStatus = event.type === 'invoice.payment_failed' ? 'past_due' : sub.status;

        await this.subscriptionsService.syncSubscriptionFromStripe(
          sub.id,
          customerId,
          mappedStatus,
          tier,
          new Date(((sub as any).current_period_start as number) * 1000),
          new Date(((sub as any).current_period_end as number) * 1000),
          sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        );

        const user = await this.prisma.user.findFirst({
          where: {
            subscription: {
              stripeSubscriptionId: sub.id,
            },
          },
        });

        if (user) {
          try {
            await this.mailService.sendSubscriptionPaymentFailedEmail(
              user.email,
              user.firstName,
              tier,
              Number(invoice.total ?? 0) / 100,
              new Date(),
            );
          } catch (mailError) {
            this.logger.warn(`Failed to send subscription payment failure email eventId=${event.id}: ${(mailError as Error).message}`);
          }
          await this.impactService.recalculateImpact(user.id);
        }
        break;
      }

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
        this.logger.log(`Webhook event ignored eventId=${event.id} type=${event.type}`);
    }
  }
}
