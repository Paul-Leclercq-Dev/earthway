import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import Stripe from 'stripe';
import { WebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { StripeProvider } from '../config/stripe.provider';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { DonationsService } from '../donations/donations.service';
import { ImpactService } from '../impact/impact.service';
import { MailService } from '../mail/mail.service';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const mockStripeEvent: Stripe.Event = {
    id: 'evt_test123',
    object: 'event',
    api_version: '2025-11-17.clover',
    created: 1710000000,
    data: {
      object: {
        id: 'sub_test123',
        customer: 'cus_test123',
        status: 'active',
        metadata: { tier: 'premium' },
        current_period_start: 1710000000,
        current_period_end: 1712678400,
      } as any,
    },
    livemode: false,
    pending_webhooks: 0,
    request: null,
    type: 'customer.subscription.created',
  };

  const mockWebhookLog = {
    id: 1,
    eventId: 'evt_test123',
    type: 'customer.subscription.created',
    status: 'received',
    payload: mockStripeEvent,
    createdAt: new Date(),
  };

  const mockPrismaWebhookLog = {
    findUnique: jest.fn(),
    create: jest.fn(),
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

  const mockQueue = {
    add: jest.fn(),
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
          provide: getQueueToken('stripe-events'),
          useValue: mockQueue,
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
        {
          provide: MailService,
          useValue: {
            sendSubscriptionPaymentFailedEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

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

    it('should throw BadRequestException when secret is missing', () => {
      mockConfig.get.mockReturnValue(undefined);

      expect(() => service.constructEvent(Buffer.from('payload'), 'sig')).toThrow(
        BadRequestException,
      );
      expect(() => service.constructEvent(Buffer.from('payload'), 'sig')).toThrow(
        'Webhook secret not configured',
      );
    });

    it('should throw BadRequestException when signature is invalid', () => {
      mockConfig.get.mockReturnValue('whsec_test123');
      mockStripe.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('bad signature');
      });

      expect(() => service.constructEvent(Buffer.from('payload'), 'sig')).toThrow(
        BadRequestException,
      );
      expect(() => service.constructEvent(Buffer.from('payload'), 'sig')).toThrow(
        'Invalid Stripe webhook signature',
      );
    });
  });

  describe('handleEvent', () => {
    it('should ignore duplicates before queuing the job', async () => {
      mockPrismaWebhookLog.findUnique.mockResolvedValue(mockWebhookLog);

      const result = await service.handleEvent(mockStripeEvent);

      expect(result).toEqual({ duplicate: true });
      expect(mockPrismaWebhookLog.create).not.toHaveBeenCalled();
      expect(mockQueue.add).not.toHaveBeenCalled();
    });

    it('should persist the event payload and enqueue the async processor', async () => {
      mockPrismaWebhookLog.findUnique.mockResolvedValue(null);
      mockPrismaWebhookLog.create.mockResolvedValue(mockWebhookLog);
      mockQueue.add.mockResolvedValue(undefined);

      const result = await service.handleEvent(mockStripeEvent);

      expect(result).toEqual({ duplicate: false });
      expect(mockPrismaWebhookLog.create).toHaveBeenCalledWith({
        data: {
          eventId: 'evt_test123',
          type: 'customer.subscription.created',
          status: 'received',
          payload: mockStripeEvent,
        },
      });
      expect(mockQueue.add).toHaveBeenCalledWith('process-event', {
        eventId: 'evt_test123',
      });
    });
  });

  describe('processQueuedEvent', () => {
    it('should process the queued event and mark it as processed', async () => {
      const spyDispatch = jest.spyOn(service as any, 'dispatch').mockResolvedValue(undefined);
      mockPrismaWebhookLog.findUnique.mockResolvedValue({
        ...mockWebhookLog,
        status: 'received',
      });
      mockPrismaWebhookLog.update.mockResolvedValue({
        ...mockWebhookLog,
        status: 'processed',
      });

      await service.processQueuedEvent('evt_test123');

      expect(spyDispatch).toHaveBeenCalledWith(mockStripeEvent);
      expect(mockPrismaWebhookLog.update).toHaveBeenCalledWith({
        where: { eventId: 'evt_test123' },
        data: { status: 'processed' },
      });
    });

    it('should skip already processed events', async () => {
      const spyDispatch = jest.spyOn(service as any, 'dispatch');
      mockPrismaWebhookLog.findUnique.mockResolvedValue({
        ...mockWebhookLog,
        status: 'processed',
      });

      await service.processQueuedEvent('evt_test123');

      expect(spyDispatch).not.toHaveBeenCalled();
      expect(mockPrismaWebhookLog.update).not.toHaveBeenCalled();
    });
  });
});
