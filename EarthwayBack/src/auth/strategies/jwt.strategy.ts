import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: number;
  email: string;
  userId?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtAccessSecret =
      configService.get<string>('SECRET_KEY') ||
      configService.get<string>('JWT_ACCESS_SECRET') ||
      'dev_jwt_access_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtAccessSecret,
    });
  }

  async validate(payload: JwtPayload) {
    const resolvedUserId = payload.userId ?? payload.sub;

    if (!resolvedUserId || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: resolvedUserId,
      userId: resolvedUserId,
      email: payload.email,
    };
  }
}
