import { SetMetadata } from '@nestjs/common';
import { Entitlement } from './plans.config';

export const REQUIRED_ENTITLEMENT_KEY = 'required_entitlement';

export const RequireEntitlement = (entitlement: Entitlement) =>
  SetMetadata(REQUIRED_ENTITLEMENT_KEY, entitlement);
