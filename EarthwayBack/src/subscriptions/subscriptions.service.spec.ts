import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionsService, TIER_PRICES } from './subscriptions.service';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StripeProvider } from '../config/stripe.provider';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { SubscriptionTierDto } from './dto/create-subscription.dto';

// Create mock Stripe methods
const mockStripe = {
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
  subscriptions: {
    update: jest.fn(),
  },
  customers: {
    create: jest.fn(),
  },
};

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    subscriptionId: null,
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSubscription = {
    id: 1,
    name: 'premium',
    price: 10,
    duration: 30,
    stripeCustomerId: 'cus_123',
    stripeSubscriptionId: 'sub_123',
    tier: SubscriptionTier.premium,
    status: SubscriptionStatus.active,
    currentPeriodStart: new Date('2024-01-01'),
    currentPeriodEnd: new Date('2024-02-01'),
    canceledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaUser = {
      findUnique: jest.fn(),
      update: jest.fn(),
    };

    const mockPrismaSubscription = {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        {
          provide: PrismaService,
          useValue: {
            user: mockPrismaUser,
            subscription: mockPrismaSubscription,
          },
        },
        {
          provide: StripeProvider,
          useValue: mockStripe,
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                STRIPE_SECRET_KEY: 'sk_test_dummy',
                STRIPE_PRICE_BASIC: 'price_basic',
                STRIPE_PRICE_PREMIUM: 'price_premium',
                STRIPE_PRICE_VIP: 'price_vip',
                FRONTEND_URL: 'http://localhost:5173',
              };
              return config[key];
            }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendSubscriptionConfirmationEmail: jest.fn(),
            sendSubscriptionCancellationEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
    prisma = module.get(PrismaService);
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
    // Reset Stripe mocks
    mockStripe.checkout.sessions.create.mockReset();
    mockStripe.subscriptions.update.mockReset();
    mockStripe.customers.create.mockReset();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Get Available Tiers Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('getAvailableTiers', () => {
    it('should return 3 subscription tiers with correct structure', () => {
      // Act
      const tiers = service.getAvailableTiers();

      // Assert
      expect(tiers).toHaveLength(3);
      expect(tiers[0]).toMatchObject({
        id: 'basic',
        name: 'Essentiel',
        price: 5,
        currency: 'EUR',
        interval: 'month',
        stripePriceId: 'price_basic',
      });
      expect(tiers[1]).toMatchObject({
        id: 'premium',
        name: 'Engagé',
        price: 10,
        stripePriceId: 'price_premium',
      });
      expect(tiers[2]).toMatchObject({
        id: 'vip',
        name: 'Ambassadeur',
        price: 20,
        stripePriceId: 'price_vip',
      });
    });

    it('should include features array for each tier', () => {
      // Act
      const tiers = service.getAvailableTiers();

      // Assert
      expect(tiers[0].features).toBeDefined();
      expect(tiers[0].features.length).toBeGreaterThan(0);
      expect(tiers[1].features.length).toBeGreaterThan(tiers[0].features.length);
      expect(tiers[2].features.length).toBeGreaterThan(tiers[1].features.length);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Get My Subscription Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('getMySubscription', () => {
    it('should return subscription if user has one', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: mockSubscription,
      });

      // Act
      const result = await service.getMySubscription(userId);

      // Assert
      expect(result).toEqual(mockSubscription);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        include: { subscription: true },
      });
    });

    it('should return null if user has no subscription', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: null,
      });

      // Act
      const result = await service.getMySubscription(userId);

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      // Arrange
      const userId = 999;
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.getMySubscription(userId);

      // Assert
      expect(result).toBeNull();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Create Subscription Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('createSubscription', () => {
    const createDto = {
      tier: SubscriptionTierDto.premium,
      stripePriceId: 'price_premium',
    };

    it('should create Stripe Checkout Session for new subscription', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUnique
        .mockResolvedValueOnce(mockUser) // First call: check user exists
        .mockResolvedValueOnce(mockUser); // Second call: getOrCreateStripeCustomer

      mockStripe.customers.create.mockResolvedValue({
        id: 'cus_new',
      });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.mockStripe.com/pay/cs_test_123',
      });

      // Act
      const result = await service.createSubscription(userId, createDto);

      // Assert
      expect(result).toHaveProperty('checkoutUrl');
      expect(result).toHaveProperty('sessionId');
      expect(result.sessionId).toBe('cs_test_123');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          customer: 'cus_new',
          line_items: [{ price: 'price_premium', quantity: 1 }],
          metadata: expect.objectContaining({
            userId: '1',
            tier: SubscriptionTierDto.premium,
          }),
        }),
      );
    });

    it('should throw NotFoundException when user does not exist', async () => {
      // Arrange
      const userId = 999;
      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.createSubscription(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when user already has active subscription', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscriptionId: 1,
      });

      prisma.subscription.findUnique.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.active,
      });

      // Act & Assert
      await expect(service.createSubscription(userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should reuse existing Stripe customer ID if available', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUnique
        .mockResolvedValueOnce({ ...mockUser, subscriptionId: 1 })
        .mockResolvedValueOnce({ ...mockUser, subscriptionId: 1 });

      prisma.subscription.findUnique
        .mockResolvedValueOnce({ ...mockSubscription, status: SubscriptionStatus.canceled })
        .mockResolvedValueOnce({ ...mockSubscription, stripeCustomerId: 'cus_existing' });

      mockStripe.checkout.sessions.create.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.mockStripe.com/pay/cs_test_123',
      });

      // Act
      const result = await service.createSubscription(userId, createDto);

      // Assert
      expect(result).toHaveProperty('checkoutUrl');
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: 'cus_existing',
        }),
      );
      expect(mockStripe.customers.create).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Cancel Subscription Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('cancelSubscription', () => {
    it('should cancel subscription at period end', async () => {
      // Arrange
      const userId = 1;
      const subscriptionId = 1;

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: mockSubscription,
      });

      mockStripe.subscriptions.update.mockResolvedValue({});

      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.canceled,
        canceledAt: new Date(),
      });

      mailService.sendSubscriptionCancellationEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.cancelSubscription(userId, subscriptionId);

      // Assert
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith(
        mockSubscription.stripeSubscriptionId,
        { cancel_at_period_end: true },
      );
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { id: subscriptionId },
        data: expect.objectContaining({
          canceledAt: expect.any(Date),
          status: SubscriptionStatus.canceled,
        }),
      });
      expect(result.status).toBe(SubscriptionStatus.canceled);
    });

    it('should throw NotFoundException when subscription not found', async () => {
      // Arrange
      const userId = 1;
      const subscriptionId = 999;

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: null,
      });

      // Act & Assert
      await expect(service.cancelSubscription(userId, subscriptionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException when subscription does not belong to user', async () => {
      // Arrange
      const userId = 1;
      const subscriptionId = 999; // Different ID

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: { ...mockSubscription, id: 1 },
      });

      // Act & Assert
      await expect(service.cancelSubscription(userId, subscriptionId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw BadRequestException when no Stripe subscription ID', async () => {
      // Arrange
      const userId = 1;
      const subscriptionId = 1;

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: { ...mockSubscription, stripeSubscriptionId: null },
      });

      // Act & Assert
      await expect(service.cancelSubscription(userId, subscriptionId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle email sending failures gracefully', async () => {
      // Arrange
      const userId = 1;
      const subscriptionId = 1;

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        subscription: mockSubscription,
      });

      mockStripe.subscriptions.update.mockResolvedValue({});

      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.canceled,
      });

      mailService.sendSubscriptionCancellationEmail.mockRejectedValue(
        new Error('SMTP error'),
      );

      // Act
      const result = await service.cancelSubscription(userId, subscriptionId);

      // Assert
      expect(result).toBeDefined();
      expect(result.status).toBe(SubscriptionStatus.canceled);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Sync Subscription From Stripe Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('syncSubscriptionFromStripe', () => {
    const syncParams = {
      stripeSubscriptionId: 'sub_123',
      stripeCustomerId: 'cus_123',
      status: 'active',
      tier: 'premium',
      currentPeriodStart: new Date('2024-01-01'),
      currentPeriodEnd: new Date('2024-02-01'),
      canceledAt: null,
      userId: 1,
    };

    it('should update existing subscription', async () => {
      // Arrange
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.active,
      });

      // Act
      const result = await service.syncSubscriptionFromStripe(
        syncParams.stripeSubscriptionId,
        syncParams.stripeCustomerId,
        syncParams.status,
        syncParams.tier,
        syncParams.currentPeriodStart,
        syncParams.currentPeriodEnd,
        syncParams.canceledAt,
        syncParams.userId,
      );

      // Assert
      expect(prisma.subscription.update).toHaveBeenCalledWith({
        where: { stripeSubscriptionId: syncParams.stripeSubscriptionId },
        data: expect.objectContaining({
          status: SubscriptionStatus.active,
          tier: SubscriptionTier.premium,
        }),
      });
      expect(result.status).toBe(SubscriptionStatus.active);
    });

    it('should create new subscription if not exists', async () => {
      // Arrange
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue({
        ...mockSubscription,
        id: 2,
      });
      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.syncSubscriptionFromStripe(
        syncParams.stripeSubscriptionId,
        syncParams.stripeCustomerId,
        syncParams.status,
        syncParams.tier,
        syncParams.currentPeriodStart,
        syncParams.currentPeriodEnd,
        syncParams.canceledAt,
        syncParams.userId,
      );

      // Assert
      expect(prisma.subscription.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          stripeSubscriptionId: syncParams.stripeSubscriptionId,
          stripeCustomerId: syncParams.stripeCustomerId,
          tier: SubscriptionTier.premium,
          status: SubscriptionStatus.active,
          price: TIER_PRICES[syncParams.tier] / 100,
        }),
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: syncParams.userId },
        data: { subscriptionId: 2 },
      });
    });

    it('should correctly map Stripe status to internal enum', async () => {
      // Arrange
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscription.update.mockResolvedValue(mockSubscription);

      // Act - Test trialing status (should map to active)
      await service.syncSubscriptionFromStripe(
        'sub_123',
        'cus_123',
        'trialing',
        'premium',
        new Date(),
        new Date(),
        null,
        1,
      );

      // Assert
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.active,
          }),
        }),
      );
    });

    it('should handle canceled status', async () => {
      // Arrange
      prisma.subscription.findUnique.mockResolvedValue(mockSubscription);
      prisma.subscription.update.mockResolvedValue({
        ...mockSubscription,
        status: SubscriptionStatus.canceled,
      });

      // Act
      const result = await service.syncSubscriptionFromStripe(
        'sub_123',
        'cus_123',
        'canceled',
        'premium',
        new Date(),
        new Date(),
        new Date(),
        1,
      );

      // Assert
      expect(result.status).toBe(SubscriptionStatus.canceled);
      expect(prisma.subscription.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: SubscriptionStatus.canceled,
            canceledAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should create subscription without linking user if userId not provided', async () => {
      // Arrange
      prisma.subscription.findUnique.mockResolvedValue(null);
      prisma.subscription.create.mockResolvedValue(mockSubscription);

      // Act
      await service.syncSubscriptionFromStripe(
        'sub_123',
        'cus_123',
        'active',
        'premium',
        new Date(),
        new Date(),
        null,
        undefined, // No userId
      );

      // Assert
      expect(prisma.subscription.create).toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
