// Impact conversion rates (euros per unit)
export const IMPACT_RATES = {
  treesPlanted: 5,      // 5€ = 1 tree planted
  coralRestored: 15,    // 15€ = 1 coral fragment restored
  pollinatorsHelped: 10, // 10€ = 1 pollinator supported
} as const;

// Subscription tier bonus multipliers
export const TIER_BONUS = {
  basic: 1.0,
  premium: 1.2,
  vip: 1.5,
} as const;
