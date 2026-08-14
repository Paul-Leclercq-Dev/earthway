import React from 'react';
import { useEntitlements } from '../Hooks/useEntitlements';
import type { Entitlement } from '../context/EntitlementsContext';

interface GateProps {
  need: Entitlement;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const Gate: React.FC<GateProps> = ({ need, fallback = null, children }) => {
  const { has, loading } = useEntitlements();

  if (loading) {
    return null;
  }

  return has(need) ? <>{children}</> : <>{fallback}</>;
};

export default Gate;
