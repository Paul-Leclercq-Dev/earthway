import { useEntitlementsContext, type Entitlement } from '../context/EntitlementsContext';

export const useEntitlements = () => {
  const context = useEntitlementsContext();

  return {
    ...context,
    has: (entitlement: Entitlement) => context.has(entitlement),
  };
};
