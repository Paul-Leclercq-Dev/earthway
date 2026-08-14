import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { EntitlementsService } from './entitlements.service';
import { Entitlement } from './plans.config';
import { REQUIRED_ENTITLEMENT_KEY } from './entitlements.decorator';

@Injectable()
export class EntitlementsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredEntitlement = this.reflector.getAllAndOverride<Entitlement | undefined>(
      REQUIRED_ENTITLEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredEntitlement) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: { id?: number; userId?: number } }>();
    const user = request.user;

    if (!user?.id && !user?.userId) {
      throw new UnauthorizedException('Authentification requise.');
    }

    const userId = user.id ?? user.userId;
    const entitlements = await this.entitlementsService.resolveForUser(userId);

    if (!entitlements.includes(requiredEntitlement)) {
      throw new ForbiddenException(
        `Droit requis manquant : ${requiredEntitlement}. Ce contenu est réservé aux abonnés avec ce niveau d’accès.`,
      );
    }

    return true;
  }
}
