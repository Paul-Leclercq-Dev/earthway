import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ImpactDto } from './dto/impact.dto';
import { IMPACT_RATES, TIER_BONUS } from './impact.constants';
import { 
  XP_REWARDS, 
  calculateLevel, 
  getNextLevelThreshold,
  getLevelProgress,
  LEVEL_TITLES 
} from './progression.constants';

@Injectable()
export class ImpactService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyImpact(userId: number): Promise<ImpactDto> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        donations: {
          where: { status: 'succeeded' },
        },
        subscription: true,
      },
    });

    // Sum all successful donations
    const totalDonated = user.donations.reduce(
      (sum, d) => sum + Number(d.amount),
      0,
    );

    // Compute ecological units from donations
    let treesFromDonations = 0;
    let coralFromDonations = 0;
    let pollinatorsFromDonations = 0;

    for (const donation of user.donations) {
      const amountEur = Number(donation.amount) / 100; // stored in cents
      switch (donation.cause) {
        case 'trees':
          treesFromDonations += Math.floor(amountEur / IMPACT_RATES.treesPlanted);
          break;
        case 'corals':
          coralFromDonations += Math.floor(amountEur / IMPACT_RATES.coralRestored);
          break;
        case 'pollinators':
          pollinatorsFromDonations += Math.floor(amountEur / IMPACT_RATES.pollinatorsHelped);
          break;
        case 'general':
          // Split equally across the three causes
          treesFromDonations += Math.floor(amountEur / 3 / IMPACT_RATES.treesPlanted);
          coralFromDonations += Math.floor(amountEur / 3 / IMPACT_RATES.coralRestored);
          pollinatorsFromDonations += Math.floor(amountEur / 3 / IMPACT_RATES.pollinatorsHelped);
          break;
      }
    }

    // Apply subscription tier bonus multiplier
    const tier = user.subscription?.tier ?? null;
    const multiplier = tier ? (TIER_BONUS[tier] ?? 1.0) : 1.0;

    const treesPlanted = Math.round(treesFromDonations * multiplier);
    const coralRestored = Math.round(coralFromDonations * multiplier);
    const pollinatorsHelped = Math.round(pollinatorsFromDonations * multiplier);

    // Persist updated impact snapshot
    await this.prisma.impact.upsert({
      where: { userId },
      create: {
        userId,
        treesFinanced: treesPlanted,
        coralsRestored: coralRestored,
        pollinatorsProtected: pollinatorsHelped,
        totalContributionEur: totalDonated / 100,
      },
      update: {
        treesFinanced: treesPlanted,
        coralsRestored: coralRestored,
        pollinatorsProtected: pollinatorsHelped,
        totalContributionEur: totalDonated / 100,
      },
    });

    // Estimate CO2 offset: ~22 kg per tree planted
    const co2Offset = treesPlanted * 22;

    return {
      totalDonated: totalDonated / 100, // return in euros
      treesPlanted,
      coralRestored,
      pollinatorsHelped,
      co2Offset,
      subscriptionTier: tier,
      donationCount: user.donations.length,
      memberSince: user.createdAt.toISOString(),
    };
  }

  /** Called after a new donation or subscription event to refresh the snapshot */
  async recalculateImpact(userId: number): Promise<void> {
    await this.getMyImpact(userId);
  }

  /**
   * Calculate user progression (XP and level)
   * Factors: donations (EUR), subscription months, and engagement
   */
  async calculateProgression(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        donations: {
          where: { status: 'succeeded' },
        },
        subscription: true,
      },
    });

    let totalXP = 0;

    // 1. XP from donations
    const totalDonatedEur = user.donations.reduce(
      (sum, d) => sum + Number(d.amount) / 100,
      0,
    );
    const donationXP = Math.floor(totalDonatedEur * XP_REWARDS.donationPerEuro);
    totalXP += donationXP;

    // 2. First donation bonus
    if (user.donations.length > 0) {
      totalXP += XP_REWARDS.firstDonation;
    }

    // 3. XP from subscription (monthly recurring)
    if (user.subscription && user.subscription.status === 'active') {
      const tier = user.subscription.tier;
      const monthlyXP = XP_REWARDS.subscriptionMonthly[tier] || 0;
      
      // Calculate months subscribed
      const startDate = user.subscriptionStart || user.subscription.currentPeriodStart;
      if (startDate) {
        const monthsSubscribed = Math.max(
          1,
          Math.floor(
            (Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30),
          ),
        );
        totalXP += monthlyXP * monthsSubscribed;
      }
      
      // First subscription bonus
      totalXP += XP_REWARDS.firstSubscription;
    }

    // 4. Profile completion bonus
    if (user.firstName && user.lastName) {
      totalXP += XP_REWARDS.profileComplete;
    }

    // Calculate level from total XP
    const level = calculateLevel(totalXP);
    const nextLevelXP = getNextLevelThreshold(level);
    const progress = getLevelProgress(totalXP, level);
    const levelTitle = LEVEL_TITLES[level] || 'Explorateur';

    // Check if user leveled up
    const oldLevel = user.level;
    const leveledUp = level > oldLevel;

    // Update user XP and level in database
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: totalXP,
        level,
      },
    });

    return {
      xp: totalXP,
      level,
      levelTitle,
      nextLevelXP,
      progress: Math.round(progress * 100), // percentage
      leveledUp,
      oldLevel,
    };
  }

  /**
   * Award XP and update user level
   * Called after significant user actions
   */
  async awardXP(userId: number, xp: number, reason: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });

    const newXP = user.xp + xp;
    const oldLevel = user.level;
    const newLevel = calculateLevel(newXP);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
      },
    });

    // TODO: If leveled up, send email notification
    if (newLevel > oldLevel) {
      console.log(
        `User ${userId} leveled up from ${oldLevel} to ${newLevel}! Reason: ${reason}`,
      );
      // await this.mailService.sendLevelUp(user.email, newLevel);
    }
  }
}
