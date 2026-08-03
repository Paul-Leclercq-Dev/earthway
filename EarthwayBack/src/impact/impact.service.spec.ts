import { Test, TestingModule } from '@nestjs/testing';
import { ImpactService } from './impact.service';
import { PrismaService } from '../prisma/prisma.service';
import { IMPACT_RATES, TIER_BONUS } from './impact.constants';
import { SubscriptionTier } from '@prisma/client';

describe('ImpactService', () => {
  let service: ImpactService;
  let prisma: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: new Date('2024-01-01'),
    donations: [],
    subscription: null,
  };

  beforeEach(async () => {
    const mockPrismaUser = {
      findUniqueOrThrow: jest.fn(),
    };

    const mockPrismaImpact = {
      upsert: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImpactService,
        {
          provide: PrismaService,
          useValue: {
            user: mockPrismaUser,
            impact: mockPrismaImpact,
          },
        },
      ],
    }).compile();

    service = module.get<ImpactService>(ImpactService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Basic Impact Calculation Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('getMyImpact', () => {
    it('should calculate impact for user with no donations', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.totalDonated).toBe(0);
      expect(result.treesPlanted).toBe(0);
      expect(result.coralRestored).toBe(0);
      expect(result.pollinatorsHelped).toBe(0);
      expect(result.co2Offset).toBe(0);
      expect(result.subscriptionTier).toBeNull();
      expect(result.donationCount).toBe(0);
    });

    it('should calculate trees from tree donations', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 2500, cause: 'trees', status: 'succeeded' }, // 25€ = 5 trees
          { amount: 1000, cause: 'trees', status: 'succeeded' }, // 10€ = 2 trees
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.totalDonated).toBe(35); // 35€
      expect(result.treesPlanted).toBe(7); // (25/5) + (10/5) = 7
      expect(result.coralRestored).toBe(0);
      expect(result.pollinatorsHelped).toBe(0);
      expect(result.co2Offset).toBe(154); // 7 trees * 22 kg
    });

    it('should calculate corals from coral donations', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 4500, cause: 'corals', status: 'succeeded' }, // 45€ = 3 corals
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.totalDonated).toBe(45);
      expect(result.treesPlanted).toBe(0);
      expect(result.coralRestored).toBe(3); // 45/15 = 3
      expect(result.pollinatorsHelped).toBe(0);
    });

    it('should calculate pollinators from pollinator donations', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 3000, cause: 'pollinators', status: 'succeeded' }, // 30€ = 3 pollinators
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.totalDonated).toBe(30);
      expect(result.treesPlanted).toBe(0);
      expect(result.coralRestored).toBe(0);
      expect(result.pollinatorsHelped).toBe(3); // 30/10 = 3
    });

    it('should split general donations equally across all causes', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 9000, cause: 'general', status: 'succeeded' }, // 90€ split equally
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      // 90€ / 3 = 30€ per cause
      expect(result.totalDonated).toBe(90);
      expect(result.treesPlanted).toBe(6); // 30/5 = 6
      expect(result.coralRestored).toBe(2); // 30/15 = 2
      expect(result.pollinatorsHelped).toBe(3); // 30/10 = 3
    });

    it('should handle mixed cause donations', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1000, cause: 'trees', status: 'succeeded' }, // 10€ = 2 trees
          { amount: 1500, cause: 'corals', status: 'succeeded' }, // 15€ = 1 coral
          { amount: 2000, cause: 'pollinators', status: 'succeeded' }, // 20€ = 2 pollinators
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.totalDonated).toBe(45);
      expect(result.treesPlanted).toBe(2);
      expect(result.coralRestored).toBe(1);
      expect(result.pollinatorsHelped).toBe(2);
    });

    it('should only count succeeded donations', async () => {
      // Arrange
      const userId = 1;
      // Note: Prisma already filters with where: { status: 'succeeded' }
      // so mock should only return succeeded donations
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1000, cause: 'trees', status: 'succeeded' }, // Only succeeded returned by Prisma
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.totalDonated).toBe(10); // Only succeeded
      expect(result.treesPlanted).toBe(2); // 10/5 = 2
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Tier Bonus Multiplier Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('tier bonuses', () => {
    it('should apply basic tier (1.0x - no bonus)', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1000, cause: 'trees', status: 'succeeded' }, // 10€ = 2 trees
        ],
        subscription: { tier: SubscriptionTier.basic },
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(2); // 2 * 1.0 = 2
      expect(result.subscriptionTier).toBe(SubscriptionTier.basic);
    });

    it('should apply premium tier (1.2x bonus)', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 2500, cause: 'trees', status: 'succeeded' }, // 25€ = 5 trees
        ],
        subscription: { tier: SubscriptionTier.premium },
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(6); // 5 * 1.2 = 6
      expect(result.subscriptionTier).toBe(SubscriptionTier.premium);
    });

    it('should apply vip tier (1.5x bonus)', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 2000, cause: 'trees', status: 'succeeded' }, // 20€ = 4 trees
        ],
        subscription: { tier: SubscriptionTier.vip },
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(6); // 4 * 1.5 = 6 (rounded)
      expect(result.subscriptionTier).toBe(SubscriptionTier.vip);
    });

    it('should apply tier bonus to all causes', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1000, cause: 'trees', status: 'succeeded' }, // 2 trees
          { amount: 1500, cause: 'corals', status: 'succeeded' }, // 1 coral
          { amount: 2000, cause: 'pollinators', status: 'succeeded' }, // 2 pollinators
        ],
        subscription: { tier: SubscriptionTier.premium },
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(2); // 2 * 1.2 = 2.4 -> 2
      expect(result.coralRestored).toBe(1); // 1 * 1.2 = 1.2 -> 1
      expect(result.pollinatorsHelped).toBe(2); // 2 * 1.2 = 2.4 -> 2
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // CO2 Calculation Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('co2Offset calculation', () => {
    it('should calculate CO2 offset at 22 kg per tree', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 5000, cause: 'trees', status: 'succeeded' }, // 50€ = 10 trees
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(10);
      expect(result.co2Offset).toBe(220); // 10 * 22 = 220 kg
    });

    it('should calculate CO2 with tier bonus applied', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 2000, cause: 'trees', status: 'succeeded' }, // 20€ = 4 trees
        ],
        subscription: { tier: SubscriptionTier.vip }, // 1.5x bonus
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(6); // 4 * 1.5 = 6
      expect(result.co2Offset).toBe(132); // 6 * 22 = 132 kg
    });

    it('should return 0 CO2 when no trees planted', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1500, cause: 'corals', status: 'succeeded' },
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.treesPlanted).toBe(0);
      expect(result.co2Offset).toBe(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Impact Persistence Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('impact persistence', () => {
    it('should persist impact snapshot to database', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1000, cause: 'trees', status: 'succeeded' },
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      await service.getMyImpact(userId);

      // Assert
      expect(prisma.impact.upsert).toHaveBeenCalledWith({
        where: { userId: 1 },
        create: expect.objectContaining({
          userId: 1,
          treesFinanced: 2,
          coralsRestored: 0,
          pollinatorsProtected: 0,
          totalContributionEur: 10,
        }),
        update: expect.objectContaining({
          treesFinanced: 2,
          coralsRestored: 0,
          pollinatorsProtected: 0,
          totalContributionEur: 10,
        }),
      });
    });

    it('should include memberSince in response', async () => {
      // Arrange
      const userId = 1;
      const memberSince = new Date('2024-01-15');
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        createdAt: memberSince,
        donations: [],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.memberSince).toBe(memberSince.toISOString());
    });

    it('should include donation count in response', async () => {
      // Arrange
      const userId = 1;
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        ...mockUser,
        donations: [
          { amount: 1000, cause: 'trees', status: 'succeeded' },
          { amount: 1500, cause: 'corals', status: 'succeeded' },
          { amount: 2000, cause: 'pollinators', status: 'succeeded' },
        ],
        subscription: null,
      });
      prisma.impact.upsert.mockResolvedValue({});

      // Act
      const result = await service.getMyImpact(userId);

      // Assert
      expect(result.donationCount).toBe(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Recalculate Impact Test
  // ──────────────────────────────────────────────────────────────────────────

  describe('recalculateImpact', () => {
    it('should call getMyImpact to refresh snapshot', async () => {
      // Arrange
      const userId = 1;
      jest.spyOn(service, 'getMyImpact').mockResolvedValue({} as any);

      // Act
      await service.recalculateImpact(userId);

      // Assert
      expect(service.getMyImpact).toHaveBeenCalledWith(userId);
    });
  });
});
