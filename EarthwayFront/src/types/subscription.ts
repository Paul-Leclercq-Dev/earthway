export enum SubscriptionTier {
  BASIC = 'basic',
  PREMIUM = 'premium',
  VIP = 'vip',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  INCOMPLETE = 'incomplete',
}

export interface Subscription {
  id: number;
  name: string;
  price: number;
  duration: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  tier?: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  canceledAt?: string;
  createdAt: string;
  updatedAt: string;
}
