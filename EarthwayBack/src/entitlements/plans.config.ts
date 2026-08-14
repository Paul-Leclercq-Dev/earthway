export type Entitlement =
  | 'ads_free'
  | 'premium_news'
  | 'advanced_impact'
  | 'impact_history'
  | 'early_access'
  | 'priority_support';

export const PLAN_ENTITLEMENTS: Record<'free' | 'basic' | 'premium' | 'vip', Entitlement[]> = {
  free: [],
  basic: ['ads_free'],
  premium: ['ads_free', 'premium_news', 'advanced_impact', 'impact_history'],
  vip: ['ads_free', 'premium_news', 'advanced_impact', 'impact_history', 'early_access', 'priority_support'],
};
