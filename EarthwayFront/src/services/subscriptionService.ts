import api from './api';

export interface SubscriptionTier {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  stripePriceId: string;
  features: string[];
}

export interface MySubscription {
  id: number;
  name: string;
  price: number;
  tier: 'basic' | 'premium' | 'vip';
  status: 'active' | 'canceled' | 'past_due' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  stripeSubscriptionId: string;
}

export const subscriptionService = {
  getAvailableTiers: () => api.get<SubscriptionTier[]>('/subscriptions'),

  getMySubscription: () => api.get<MySubscription | null>('/subscriptions/me'),

  createSubscription: (tier: string, stripePriceId: string) =>
    api.post<{ checkoutUrl: string; sessionId: string }>('/subscriptions', {
      tier,
      stripePriceId,
    }),

  cancelSubscription: (id: number) =>
    api.delete(`/subscriptions/${id}`),
};
