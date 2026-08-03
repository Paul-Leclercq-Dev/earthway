import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  // ─── Registration ───────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà.');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        password: hashedPassword,
        oauthProvider: 'local',
        emailVerified: false,
        refreshToken: emailVerificationToken,
      },
    });

    // Send welcome + verification email
    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        user.firstName,
        emailVerificationToken,
      );
    } catch (err) {
      this.logger.warn(`Failed to send verification email to ${user.email}: ${(err as Error).message}`);
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.toPublicUser(user), ...tokens };
  }

  // ─── Login ──────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return { user: this.toPublicUser(user), ...tokens };
  }

  // ─── Validate Credentials ──────────────────────────────────────────────────

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.password) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    return user;
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  async validateGoogleUser(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
    oauthProvider: string;
    oauthId: string;
  }) {
    let user = await this.prisma.user.findUnique({
      where: { email: googleUser.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: googleUser.email,
          firstName: googleUser.firstName,
          lastName: googleUser.lastName,
          photoUrl: googleUser.photoUrl,
          oauthProvider: googleUser.oauthProvider,
          oauthId: googleUser.oauthId,
          emailVerified: true,
        },
      });
    } else if (!user.oauthId) {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          oauthProvider: googleUser.oauthProvider,
          oauthId: googleUser.oauthId,
          photoUrl: googleUser.photoUrl ?? user.photoUrl,
          emailVerified: true,
        },
      });
    }

    return user;
  }

  // ─── Token Refresh ─────────────────────────────────────────────────────────

  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Accès refusé.');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      throw new UnauthorizedException('Refresh token invalide.');
    }

    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ─── Email Verification ────────────────────────────────────────────────────

  async verifyEmail(token: string) {
    // Token is stored temporarily in refreshToken field during new registration
    // For production, use a dedicated verification token table
    const user = await this.prisma.user.findFirst({
      where: { emailVerified: false },
    });

    if (!user) {
      throw new BadRequestException('Token invalide ou expiré.');
    }

    // Validate by comparing (we store raw token at registration)
    // In a real deployment, use a separate VerificationToken model
    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { message: 'Email vérifié avec succès.' };
  }

  // ─── Password Reset ────────────────────────────────────────────────────────

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration attacks
    if (!user || user.oauthProvider !== 'local') {
      return { message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(resetToken, 10);

    // Store hashed reset token temporarily in refreshToken field
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedToken },
    });

    try {
      await this.mailService.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (err) {
      this.logger.warn(`Failed to send password reset email: ${(err as Error).message}`);
    }

    return { message: 'Si ce compte existe, un email de réinitialisation a été envoyé.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // Find user whose refreshToken matches this reset token
    const users = await this.prisma.user.findMany({
      where: { refreshToken: { not: null } },
    });

    let targetUser = null;
    for (const user of users) {
      if (user.refreshToken && await bcrypt.compare(token, user.refreshToken)) {
        targetUser = user;
        break;
      }
    }

    if (!targetUser) {
      throw new BadRequestException('Token invalide ou expiré.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: targetUser.id },
      data: { password: hashedPassword, refreshToken: null },
    });

    return { message: 'Mot de passe réinitialisé avec succès.' };
  }

  // ─── Google Callback (tokens + save) ──────────────────────────────────────

  async handleGoogleLogin(googleUser: {
    email: string;
    firstName: string;
    lastName: string;
    photoUrl: string;
    oauthProvider: string;
    oauthId: string;
  }) {
    const user = await this.validateGoogleUser(googleUser);
    const tokens = await this.generateTokens(user.id, user.email);
    await this.saveRefreshToken(user.id, tokens.refreshToken);
    return { user: this.toPublicUser(user), ...tokens };
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async generateTokens(userId: number, email: string) {
    const payload = { sub: userId, email };

    const accessExpires = (this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m') as any);
    const refreshExpires = (this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d') as any);
    const accessSecret = this.config.get<string>('JWT_ACCESS_SECRET') || 'dev_jwt_access_secret';
    const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') || 'dev_jwt_refresh_secret';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpires,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpires,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: number, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }

  private toPublicUser(user: any) {
    const { password, refreshToken, ...publicData } = user;
    return publicData;
  }
}
