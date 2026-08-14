import { Injectable } from '@nestjs/common';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Entitlement, PLAN_ENTITLEMENTS } from './plans.config';

@Injectable()
export class EntitlementsService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveForUser(userId: number): Promise<Entitlement[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user?.subscription) {
      return PLAN_ENTITLEMENTS.free;
    }

    const subscription = user.subscription;
    const isActiveSubscription =
      subscription.status === SubscriptionStatus.active &&
      subscription.currentPeriodEnd instanceof Date &&
      subscription.currentPeriodEnd.getTime() > Date.now();

    if (!isActiveSubscription) {
      return PLAN_ENTITLEMENTS.free;
    }

    const tier = subscription.tier;
    if (!tier) {
      return PLAN_ENTITLEMENTS.free;
    }

    const currentTier = tier as SubscriptionTier;
    const tierKey = currentTier as keyof typeof PLAN_ENTITLEMENTS;

    return PLAN_ENTITLEMENTS[tierKey] ?? PLAN_ENTITLEMENTS.free;
  }
}
