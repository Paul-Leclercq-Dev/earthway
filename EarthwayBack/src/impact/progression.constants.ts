// Progression constants for gamification system

// XP rewards
export const XP_REWARDS = {
  // One-time rewards
  firstDonation: 100,
  firstSubscription: 200,
  profileComplete: 50,
  
  // Recurring rewards
  donationPerEuro: 10, // 10 XP per EUR donated
  subscriptionMonthly: {
    sapling: 50,
    tree: 100,
    forest: 200,
  },
  
  // Engagement rewards
  dailyVisit: 5,
  weeklyStreak: 25,
  monthlyStreak: 100,
} as const;

// Level thresholds (XP required to reach each level)
export const LEVEL_THRESHOLDS = [
  0,      // Level 0 (starting)
  100,    // Level 1
  250,    // Level 2
  500,    // Level 3
  1000,   // Level 4
  2000,   // Level 5
  3500,   // Level 6
  5500,   // Level 7
  8000,   // Level 8
  11000,  // Level 9
  15000,  // Level 10
  20000,  // Level 11
  26000,  // Level 12
  33000,  // Level 13
  41000,  // Level 14
  50000,  // Level 15 (max)
] as const;

// Level titles
export const LEVEL_TITLES = {
  0: 'Nouveau venu',
  1: 'Explorateur',
  2: 'Curieux',
  3: 'Engagé',
  4: 'Actif',
  5: 'Passionné',
  6: 'Défenseur',
  7: 'Champion',
  8: 'Héros vert',
  9: 'Gardien',
  10: 'Ambassadeur',
  11: 'Leader',
  12: 'Visionnaire',
  13: 'Légende',
  14: 'Maître',
  15: 'Sage',
} as const;

// Badge/achievement thresholds
export const ACHIEVEMENT_THRESHOLDS = {
  donations: {
    bronze: 1,
    silver: 5,
    gold: 10,
    platinum: 25,
  },
  totalDonated: {
    bronze: 10,    // 10 EUR
    silver: 50,    // 50 EUR
    gold: 100,     // 100 EUR
    platinum: 500, // 500 EUR
  },
  treesPlanted: {
    bronze: 10,
    silver: 50,
    gold: 100,
    platinum: 500,
  },
  subscriptionMonths: {
    bronze: 1,
    silver: 3,
    gold: 6,
    platinum: 12,
  },
} as const;

/**
 * Calculate level from total XP
 */
export function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      return i;
    }
  }
  return 0;
}

/**
 * Get XP required for next level
 */
export function getNextLevelThreshold(currentLevel: number): number | null {
  if (currentLevel >= LEVEL_THRESHOLDS.length - 1) {
    return null; // Max level reached
  }
  return LEVEL_THRESHOLDS[currentLevel + 1];
}

/**
 * Calculate XP progress within current level (0-1)
 */
export function getLevelProgress(xp: number, currentLevel: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[currentLevel];
  const nextThreshold = getNextLevelThreshold(currentLevel);
  
  if (!nextThreshold) {
    return 1; // Max level
  }
  
  const xpInLevel = xp - currentThreshold;
  const xpNeededForLevel = nextThreshold - currentThreshold;
  
  return xpInLevel / xpNeededForLevel;
}
