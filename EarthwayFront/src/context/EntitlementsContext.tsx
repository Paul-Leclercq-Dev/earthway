import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../Hooks/useAuth';

export type Entitlement =
  | 'ads_free'
  | 'premium_news'
  | 'advanced_impact'
  | 'impact_history'
  | 'early_access'
  | 'priority_support';

export type SubscriptionTier = 'free' | 'basic' | 'premium' | 'vip';

interface EntitlementsResponse {
  entitlements: Entitlement[];
  tier: SubscriptionTier;
}

interface EntitlementsContextValue {
  entitlements: Entitlement[];
  tier: SubscriptionTier;
  loading: boolean;
  error: string | null;
  has: (entitlement: Entitlement) => boolean;
  refetch: () => Promise<void>;
}

export const EntitlementsContext = createContext<EntitlementsContextValue | undefined>(undefined);

export const EntitlementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);
  const [tier, setTier] = useState<SubscriptionTier>('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEntitlements = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setEntitlements([]);
      setTier('free');
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await api.get<EntitlementsResponse>('/users/me/entitlements');
      setEntitlements(data.entitlements ?? []);
      setTier(data.tier ?? 'free');
    } catch (err: any) {
      setEntitlements([]);
      setTier('free');
      setError(err?.response?.data?.message || 'Impossible de charger les droits utilisateur.');
    } finally {
      setLoading(false);
    }
  }, [accessToken, isAuthenticated]);

  useEffect(() => {
    fetchEntitlements();
  }, [fetchEntitlements]);

  useEffect(() => {
    const handleSubscriptionUpdated = () => {
      void fetchEntitlements();
    };

    window.addEventListener('subscription:updated', handleSubscriptionUpdated);

    return () => {
      window.removeEventListener('subscription:updated', handleSubscriptionUpdated);
    };
  }, [fetchEntitlements]);

  const has = useCallback(
    (entitlement: Entitlement) => entitlements.includes(entitlement),
    [entitlements],
  );

  const value = useMemo<EntitlementsContextValue>(
    () => ({
      entitlements,
      tier,
      loading,
      error,
      has,
      refetch: fetchEntitlements,
    }),
    [entitlements, tier, loading, error, has, fetchEntitlements],
  );

  return (
    <EntitlementsContext.Provider value={value}>{children}</EntitlementsContext.Provider>
  );
};

export const useEntitlementsContext = () => {
  const context = useContext(EntitlementsContext);

  if (!context) {
    throw new Error('useEntitlementsContext must be used within an EntitlementsProvider');
  }

  return context;
};
