import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeProvider } from '../config/stripe.provider';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DonationsService } from '../donations/donations.service';
import { ImpactService } from '../impact/impact.service';

describe('WebhooksService', () => {
  let service: WebhooksService;
  let prisma: PrismaService;
  let config: ConfigService;
  let stripeProvider: StripeProvider;
  let subscriptionsService: SubscriptionsService;
  let donationsService: DonationsService;
  let impactService: ImpactService;

  // ─── Mock Data ────────────────────────────────────────────────────────────

  const mockWebhookLog = {
    id: 1,
    stripeEventId: 'evt_test123',
    eventType: 'payment_intent.succeeded',
    status: 'processed' as const,
    payload: '{}',
    processedAt: new Date(),
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 2,
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockDonation = {
    id: 1,
    amount: 50.0,
    cause: 'trees' as const,
    status: 'pending' as const,
    stripePaymentIntentId: 'pi_test123',
    userId: 2,
    ongId: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockStripeEvent: Stripe.Event = {
    id: 'evt_test123',
    object: 'event',
    api_version: '2025-11-17.clover',
    created: 1710000000,
    data: {
      object: {} as any,
    },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type: 'payment_intent.succeeded',
  };

  // ─── Mock Objects ─────────────────────────────────────────────────────────

  const mockPrismaWebhookLog = {
    findUnique: jest.fn(),
    upsert: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaUser = {
    findFirst: jest.fn(),
  };

  const mockPrismaDonation = {
    findUnique: jest.fn(),
  };

  const mockStripe = {
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  const mockConfig = {
    get: jest.fn(),
  };

  const mockSubscriptions = {
    syncSubscriptionFromStripe: jest.fn(),
  };

  const mockDonations = {
    syncDonationFromStripe: jest.fn(),
  };

  const mockImpact = {
    recalculateImpact: jest.fn(),
  };

  // ─── Setup ────────────────────────────────────────────────────────────────

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: {
            webhookLog: mockPrismaWebhookLog,
            user: mockPrismaUser,
            donation: mockPrismaDonation,
          },
        },
        {
          provide: StripeProvider,
          useValue: mockStripe,
        },
        {
          provide: ConfigService,
          useValue: mockConfig,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptions,
        },
        {
          provide: DonationsService,
          useValue: mockDonations,
        },
        {
          provide: ImpactService,
          useValue: mockImpact,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
    prisma = module.get<PrismaService>(PrismaService);
    config = module.get<ConfigService>(ConfigService);
    stripeProvider = module.get<StripeProvider>(StripeProvider);
    subscriptionsService = module.get<SubscriptionsService>(
      SubscriptionsService,
    );
    donationsService = module.get<DonationsService>(DonationsService);
    impactService = module.get<ImpactService>(ImpactService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CONSTRUCT EVENT (Signature Validation)
  // ──────────────────────────────────────────────────────────────────────────

  describe('constructEvent', () => {
    it('should validate and construct Stripe event with valid signature', () => {
      const rawBody = Buffer.from('test payload');
      const signature = 'valid_sig_123';
      const webhookSecret = 'whsec_test123';

      mockConfig.get.mockReturnValue(webhookSecret);
      mockStripe.webhooks.constructEvent.mockReturnValue(mockStripeEvent);

      const result = service.constructEvent(rawBody, signature);

      expect(mockConfig.get).toHaveBeenCalledWith('STRIPE_WEBHOOK_SECRET');
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(
        rawBody,
        signature,
        webhookSecret,
      );
      expect(result).toEqual(mockStripeEvent);
    });

    it('should throw BadRequestException if webhook secret not configured', () => {
      const rawBody = Buffer.from('test payload');
      const signature = 'valid_sig_123';

      mockConfig.get.mockReturnValue(undefined);

      expect(() => service.constructEvent(rawBody, signature)).toThrow(
        BadRequestException,
      );
      expect(() => service.constructEvent(rawBody, signature)).toThrow(
        'Webhook secret not configured',
      );
    });

    it('should throw BadRequestException on invalid signature', () => {
      const rawBody = Buffer.from('test payload');
      const signature = 'invalid_sig';
      const webhookSecret = 'whsec_test123';

      mockConfig.get.mockReturnValue(webhookSecret);
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('Signature verification failed');
      });

      expect(() => service.constructEvent(rawBody, signature)).toThrow(
        BadRequestException,
      );
      expect(() => service.constructEvent(rawBody, signature)).toThrow(
        'Invalid Stripe webhook signature',
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // HANDLE EVENT (Idempotency + Dispatch)
  // ──────────────────────────────────────────────────────────────────────────

  describe('handleEvent', () => {
    it('should skip already processed event', async () => {
      mockPrismaWebhookLog.findUnique.mockResolvedValue({
        ...mockWebhookLog,
        status: 'processed',
      });

      await service.handleEvent(mockStripeEvent);

      expect(mockPrismaWebhookLog.findUnique).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
      });
      expect(mockPrismaWebhookLog.upsert).not.toHaveBeenCalled();
      expect(mockPrismaWebhookLog.update).not.toHaveBeenCalled();
    });

    it('should process new event and mark as processed', async () => {
      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue({
        ...mockWebhookLog,
        status: 'processed',
      });
      mockPrismaDonation.findUnique.mockResolvedValue(null);

      await service.handleEvent(mockStripeEvent);

      expect(mockPrismaWebhookLog.upsert).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
        create: {
          stripeEventId: 'evt_test123',
          eventType: 'payment_intent.succeeded',
          status: 'pending',
          payload: JSON.stringify(mockStripeEvent),
        },
        update: {
          status: 'pending',
        },
      });

      expect(mockPrismaWebhookLog.update).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
        data: { status: 'processed', processedAt: expect.any(Date) },
      });
    });

    it('should mark event as failed if dispatch throws error', async () => {
      const errorEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'payment_intent.succeeded',
        data: {
          object: { id: 'pi_error' } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaDonation.findUnique.mockRejectedValue(
        new Error('Database error'),
      );
      mockPrismaWebhookLog.update.mockResolvedValue({
        ...mockWebhookLog,
        status: 'failed',
      });

      await expect(service.handleEvent(errorEvent)).rejects.toThrow(
        'Database error',
      );

      expect(mockPrismaWebhookLog.update).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
        data: {
          status: 'failed',
          errorMessage: 'Database error',
        },
      });
    });

    it('should process pending event (retry scenario)', async () => {
      mockPrismaWebhookLog.findUnique.mockResolvedValue({
        ...mockWebhookLog,
        status: 'pending', // Not processed yet
      });
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue({
        ...mockWebhookLog,
        status: 'processed',
      });
      mockPrismaDonation.findUnique.mockResolvedValue(null);

      await service.handleEvent(mockStripeEvent);

      expect(mockPrismaWebhookLog.upsert).toHaveBeenCalled();
      expect(mockPrismaWebhookLog.update).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
        data: { status: 'processed', processedAt: expect.any(Date) },
      });
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // DISPATCH (Event Routing)
  // ──────────────────────────────────────────────────────────────────────────

  describe('dispatch - subscription events', () => {
    it('should handle customer.subscription.created', async () => {
      const subEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            metadata: { tier: 'premium' },
            current_period_start: 1710000000,
            current_period_end: 1712678400,
            canceled_at: null,
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockSubscriptions.syncSubscriptionFromStripe.mockResolvedValue(undefined);
      mockImpact.recalculateImpact.mockResolvedValue(undefined);

      await service.handleEvent(subEvent);

      expect(mockSubscriptions.syncSubscriptionFromStripe).toHaveBeenCalledWith(
        'sub_test123',
        'cus_test123',
        'active',
        'premium',
        new Date(1710000000 * 1000),
        new Date(1712678400 * 1000),
        null,
      );

      expect(mockPrismaUser.findFirst).toHaveBeenCalledWith({
        where: {
          subscription: {
            stripeSubscriptionId: 'sub_test123',
          },
        },
      });

      expect(mockImpact.recalculateImpact).toHaveBeenCalledWith(2);
    });

    it('should handle customer.subscription.updated', async () => {
      const subEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            metadata: { tier: 'vip' },
            current_period_start: 1710000000,
            current_period_end: 1712678400,
            canceled_at: null,
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockSubscriptions.syncSubscriptionFromStripe.mockResolvedValue(undefined);
      mockImpact.recalculateImpact.mockResolvedValue(undefined);

      await service.handleEvent(subEvent);

      expect(mockSubscriptions.syncSubscriptionFromStripe).toHaveBeenCalledWith(
        'sub_test123',
        'cus_test123',
        'active',
        'vip',
        expect.any(Date),
        expect.any(Date),
        null,
      );
    });

    it('should handle customer.subscription.deleted with canceledAt', async () => {
      const subEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'canceled',
            metadata: { tier: 'basic' },
            current_period_start: 1710000000,
            current_period_end: 1712678400,
            canceled_at: 1711000000,
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaUser.findFirst.mockResolvedValue(mockUser);
      mockSubscriptions.syncSubscriptionFromStripe.mockResolvedValue(undefined);
      mockImpact.recalculateImpact.mockResolvedValue(undefined);

      await service.handleEvent(subEvent);

      expect(mockSubscriptions.syncSubscriptionFromStripe).toHaveBeenCalledWith(
        'sub_test123',
        'cus_test123',
        'canceled',
        'basic',
        expect.any(Date),
        expect.any(Date),
        new Date(1711000000 * 1000),
      );
    });

    it('should default to basic tier if metadata missing', async () => {
      const subEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
            metadata: {}, // No tier
            current_period_start: 1710000000,
            current_period_end: 1712678400,
            canceled_at: null,
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaUser.findFirst.mockResolvedValue(null);
      mockSubscriptions.syncSubscriptionFromStripe.mockResolvedValue(undefined);

      await service.handleEvent(subEvent);

      expect(mockSubscriptions.syncSubscriptionFromStripe).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        'basic', // Default tier
        expect.any(Date),
        expect.any(Date),
        null,
      );
    });

    it('should not recalculate impact if user not found', async () => {
      const subEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_orphan',
            customer: 'cus_orphan',
            status: 'active',
            metadata: { tier: 'basic' },
            current_period_start: 1710000000,
            current_period_end: 1712678400,
            canceled_at: null,
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaUser.findFirst.mockResolvedValue(null);
      mockSubscriptions.syncSubscriptionFromStripe.mockResolvedValue(undefined);

      await service.handleEvent(subEvent);

      expect(mockImpact.recalculateImpact).not.toHaveBeenCalled();
    });
  });

  describe('dispatch - payment events', () => {
    it('should handle payment_intent.succeeded', async () => {
      const piEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_test123',
            amount: 5000,
            currency: 'eur',
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaDonation.findUnique.mockResolvedValue(mockDonation);
      mockDonations.syncDonationFromStripe.mockResolvedValue(undefined);
      mockImpact.recalculateImpact.mockResolvedValue(undefined);

      await service.handleEvent(piEvent);

      expect(mockPrismaDonation.findUnique).toHaveBeenCalledWith({
        where: { stripePaymentIntentId: 'pi_test123' },
      });

      expect(mockDonations.syncDonationFromStripe).toHaveBeenCalledWith(
        'pi_test123',
        'succeeded',
      );

      expect(mockImpact.recalculateImpact).toHaveBeenCalledWith(2);
    });

    it('should handle payment_intent.payment_failed', async () => {
      const piEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'payment_intent.payment_failed',
        data: {
          object: {
            id: 'pi_test123',
            amount: 5000,
            currency: 'eur',
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockDonations.syncDonationFromStripe.mockResolvedValue(undefined);

      await service.handleEvent(piEvent);

      expect(mockDonations.syncDonationFromStripe).toHaveBeenCalledWith(
        'pi_test123',
        'failed',
      );

      // No impact recalculation for failed payments
      expect(mockImpact.recalculateImpact).not.toHaveBeenCalled();
    });

    it('should skip payment_intent.succeeded if donation not found', async () => {
      const piEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'payment_intent.succeeded',
        data: {
          object: {
            id: 'pi_nonexistent',
            amount: 5000,
            currency: 'eur',
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaDonation.findUnique.mockResolvedValue(null);

      await service.handleEvent(piEvent);

      expect(mockDonations.syncDonationFromStripe).not.toHaveBeenCalled();
      expect(mockImpact.recalculateImpact).not.toHaveBeenCalled();
    });
  });

  describe('dispatch - checkout session', () => {
    it('should handle checkout.session.completed (payment mode)', async () => {
      const checkoutEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            mode: 'payment',
            payment_intent: 'pi_test123',
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaDonation.findUnique.mockResolvedValue(mockDonation);
      mockDonations.syncDonationFromStripe.mockResolvedValue(undefined);
      mockImpact.recalculateImpact.mockResolvedValue(undefined);

      await service.handleEvent(checkoutEvent);

      expect(mockDonations.syncDonationFromStripe).toHaveBeenCalledWith(
        'pi_test123',
        'succeeded',
      );

      expect(mockImpact.recalculateImpact).toHaveBeenCalledWith(2);
    });

    it('should handle checkout.session.completed with payment_intent object', async () => {
      const checkoutEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            mode: 'payment',
            payment_intent: { id: 'pi_test456' } as any,
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaDonation.findUnique.mockResolvedValue(mockDonation);
      mockDonations.syncDonationFromStripe.mockResolvedValue(undefined);
      mockImpact.recalculateImpact.mockResolvedValue(undefined);

      await service.handleEvent(checkoutEvent);

      expect(mockDonations.syncDonationFromStripe).toHaveBeenCalledWith(
        'pi_test456',
        'succeeded',
      );
    });

    it('should skip checkout.session.completed if not payment mode', async () => {
      const checkoutEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            mode: 'subscription',
            subscription: 'sub_test123',
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);

      await service.handleEvent(checkoutEvent);

      expect(mockDonations.syncDonationFromStripe).not.toHaveBeenCalled();
      expect(mockImpact.recalculateImpact).not.toHaveBeenCalled();
    });

    it('should skip checkout.session.completed if donation not found', async () => {
      const checkoutEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'checkout.session.completed',
        data: {
          object: {
            id: 'cs_test123',
            mode: 'payment',
            payment_intent: 'pi_nonexistent',
          } as any,
        },
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);
      mockPrismaDonation.findUnique.mockResolvedValue(null);

      await service.handleEvent(checkoutEvent);

      expect(mockDonations.syncDonationFromStripe).not.toHaveBeenCalled();
      expect(mockImpact.recalculateImpact).not.toHaveBeenCalled();
    });
  });

  describe('dispatch - unhandled events', () => {
    it('should log unhandled event types without error', async () => {
      const unknownEvent: Stripe.Event = {
        ...mockStripeEvent,
        type: 'invoice.payment_succeeded' as any,
      };

      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.upsert.mockResolvedValue(mockWebhookLog);
      mockPrismaWebhookLog.update.mockResolvedValue(mockWebhookLog);

      await service.handleEvent(unknownEvent);

      expect(mockPrismaWebhookLog.update).toHaveBeenCalledWith({
        where: { stripeEventId: 'evt_test123' },
        data: { status: 'processed', processedAt: expect.any(Date) },
      });
    });
  });
});
