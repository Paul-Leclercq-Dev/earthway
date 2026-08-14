import { Entitlement } from '../../entitlements/plans.config';

export type UserTier = 'free' | 'basic' | 'premium' | 'vip';

export class UserEntitlementsResponseDto {
  entitlements: Entitlement[];
  tier: UserTier;
}
