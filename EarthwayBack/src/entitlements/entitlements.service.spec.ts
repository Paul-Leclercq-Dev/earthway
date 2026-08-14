import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from './entitlements.service';
import { PLAN_ENTITLEMENTS } from './plans.config';

describe('EntitlementsService', () => {
  let service: EntitlementsService;
  let prisma: any;

  const buildUser = (subscription?: any) => ({
    id: 1,
    subscription,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntitlementsService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<EntitlementsService>(EntitlementsService);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns free entitlements when user has no subscription', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(service.resolveForUser(1)).resolves.toEqual(PLAN_ENTITLEMENTS.free);
  });

  it('returns free entitlements for a free plan', async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        status: SubscriptionStatus.active,
        currentPeriodEnd: new Date(Date.now() + 60_000),
        tier: null,
      }),
    );

    await expect(service.resolveForUser(1)).resolves.toEqual(PLAN_ENTITLEMENTS.free);
  });

  it('returns basic entitlements for a basic subscription', async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        status: SubscriptionStatus.active,
        currentPeriodEnd: new Date(Date.now() + 60_000),
        tier: SubscriptionTier.basic,
      }),
    );

    await expect(service.resolveForUser(1)).resolves.toEqual(PLAN_ENTITLEMENTS.basic);
  });

  it('returns premium entitlements for a premium subscription', async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        status: SubscriptionStatus.active,
        currentPeriodEnd: new Date(Date.now() + 60_000),
        tier: SubscriptionTier.premium,
      }),
    );

    await expect(service.resolveForUser(1)).resolves.toEqual(PLAN_ENTITLEMENTS.premium);
  });

  it('returns vip entitlements for a vip subscription', async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        status: SubscriptionStatus.active,
        currentPeriodEnd: new Date(Date.now() + 60_000),
        tier: SubscriptionTier.vip,
      }),
    );

    await expect(service.resolveForUser(1)).resolves.toEqual(PLAN_ENTITLEMENTS.vip);
  });

  it('falls back to free entitlements when the active subscription is expired', async () => {
    prisma.user.findUnique.mockResolvedValue(
      buildUser({
        status: SubscriptionStatus.active,
        currentPeriodEnd: new Date(Date.now() - 60_000),
        tier: SubscriptionTier.premium,
      }),
    );

    await expect(service.resolveForUser(1)).resolves.toEqual(PLAN_ENTITLEMENTS.free);
  });
});
