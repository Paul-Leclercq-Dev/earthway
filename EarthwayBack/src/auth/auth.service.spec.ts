import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;
  let mailService: jest.Mocked<MailService>;

  // Test data fixtures
  const mockUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: '$2b$12$hashedPassword',
    oauthProvider: 'local',
    emailVerified: false,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    oauthId: null,
    photoUrl: null,
    emailNotifications: true,
    pushNotifications: false,
  };

  const mockGoogleUser = {
    email: 'google@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    photoUrl: 'https://example.com/photo.jpg',
    oauthProvider: 'google',
    oauthId: 'google-oauth-id-123',
  };

  const mockTokens = {
    accessToken: 'mock.access.token',
    refreshToken: 'mock.refresh.token',
  };

  beforeEach(async () => {
    // Create mock Prisma methods
    const mockPrismaUser = {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    // Create testing module with mocked providers
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: mockPrismaUser,
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: string) => {
              const config: Record<string, string> = {
                JWT_ACCESS_SECRET: 'test-access-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_ACCESS_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendVerificationEmail: jest.fn(),
            sendPasswordResetEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get(PrismaService);
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;
    configService = module.get(ConfigService) as jest.Mocked<ConfigService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Registration Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('register', () => {
    it('should create a new user and return tokens', async () => {
      // Arrange
      const dto = {
        email: 'newuser@example.com',
        firstName: 'Alice',
        lastName: 'Wonder',
        password: 'SecurePass123!',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ ...mockUser, ...dto });

      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      prisma.user.update.mockResolvedValue(mockUser);
      mailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.register(dto);

      // Assert
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: dto.email },
      });
      expect(prisma.user.create).toHaveBeenCalled();
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException when email already exists', async () => {
      // Arrange
      const dto = {
        email: 'existing@example.com',
        firstName: 'Bob',
        lastName: 'Builder',
        password: 'Password123!',
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should handle email sending failures gracefully', async () => {
      // Arrange
      const dto = {
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'Password123!',
      };

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(mockUser);
      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prisma.user.update.mockResolvedValue(mockUser);
      mailService.sendVerificationEmail.mockRejectedValue(new Error('SMTP error'));

      // Act
      const result = await service.register(dto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(mailService.sendVerificationEmail).toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Login Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      // Arrange
      const dto = { email: 'test@example.com', password: 'CorrectPassword' };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true) as any);

      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.login(dto);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockUser.email);
    });

    it('should throw UnauthorizedException for invalid email', async () => {
      // Arrange
      const dto = { email: 'wrong@example.com', password: 'Password' };

      prisma.user.findUnique.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      const dto = { email: 'test@example.com', password: 'WrongPassword' };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false) as any);

      // Act & Assert
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Token Refresh Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('refreshTokens', () => {
    it('should generate new tokens with valid refresh token', async () => {
      // Arrange
      const userId = 1;
      const refreshToken = 'valid.refresh.token';
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: hashedRefreshToken,
      });

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true) as any);

      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);

      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.refreshTokens(userId, refreshToken);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      // Arrange
      const userId = 1;
      const refreshToken = 'invalid.token';

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: 'differentHashedToken',
      });

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false) as any);

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when user has no refresh token', async () => {
      // Arrange
      const userId = 1;
      const refreshToken = 'some.token';

      prisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        refreshToken: null,
      });

      // Act & Assert
      await expect(service.refreshTokens(userId, refreshToken)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Google OAuth Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('validateGoogleUser', () => {
    it('should create a new user for first-time Google login', async () => {
      // Arrange
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        ...mockUser,
        ...mockGoogleUser,
        id: 2,
        emailVerified: true,
      });

      // Act
      const result = await service.validateGoogleUser(mockGoogleUser);

      // Assert
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: mockGoogleUser.email,
          oauthProvider: 'google',
          emailVerified: true,
        }),
      });
      expect(result.emailVerified).toBe(true);
    });

    it('should update existing user when linking Google account', async () => {
      // Arrange
      const existingUser = { ...mockUser, oauthId: null };
      prisma.user.findUnique.mockResolvedValue(existingUser);
      prisma.user.update.mockResolvedValue({
        ...existingUser,
        ...mockGoogleUser,
      });

      // Act
      const result = await service.validateGoogleUser(mockGoogleUser);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: existingUser.id },
        data: expect.objectContaining({
          oauthProvider: 'google',
          oauthId: mockGoogleUser.oauthId,
          emailVerified: true,
        }),
      });
      expect(result.oauthId).toBe(mockGoogleUser.oauthId);
    });

    it('should return existing user if already linked to Google', async () => {
      // Arrange
      const googleUser = {
        ...mockUser,
        ...mockGoogleUser,
        emailVerified: true,
      };
      prisma.user.findUnique.mockResolvedValue(googleUser);

      // Act
      const result = await service.validateGoogleUser(mockGoogleUser);

      // Assert
      expect(result).toEqual(googleUser);
      expect(prisma.user.create).not.toHaveBeenCalled();
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });

  describe('handleGoogleLogin', () => {
    it('should complete Google login flow with tokens', async () => {
      // Arrange
      const googleUser = {
        ...mockUser,
        ...mockGoogleUser,
        emailVerified: true,
      };

      prisma.user.findUnique.mockResolvedValue(googleUser);
      jwtService.signAsync
        .mockResolvedValueOnce(mockTokens.accessToken)
        .mockResolvedValueOnce(mockTokens.refreshToken);
      prisma.user.update.mockResolvedValue(googleUser);

      // Act
      const result = await service.handleGoogleLogin(mockGoogleUser);

      // Assert
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe(mockGoogleUser.email);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Email Verification Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('verifyEmail', () => {
    it('should mark email as verified with valid token', async () => {
      // Arrange
      const token = 'valid-verification-token';
      const unverifiedUser = { ...mockUser, emailVerified: false };

      prisma.user.findFirst.mockResolvedValue(unverifiedUser);
      prisma.user.update.mockResolvedValue({
        ...unverifiedUser,
        emailVerified: true,
      });

      // Act
      const result = await service.verifyEmail(token);

      // Assert
      expect(result).toHaveProperty('message');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: unverifiedUser.id },
        data: { emailVerified: true },
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      prisma.user.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(service.verifyEmail(token)).rejects.toThrow(BadRequestException);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Password Reset Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('forgotPassword', () => {
    it('should send reset email for valid local account', async () => {
      // Arrange
      const email = 'test@example.com';
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.user.update.mockResolvedValue(mockUser);
      mailService.sendPasswordResetEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.forgotPassword(email);

      // Assert
      expect(result).toHaveProperty('message');
      expect(mailService.sendPasswordResetEmail).toHaveBeenCalled();
    });

    it('should not reveal if email does not exist', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      prisma.user.findUnique.mockResolvedValue(null);

      // Act
      const result = await service.forgotPassword(email);

      // Assert
      expect(result).toHaveProperty('message');
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('should not send email for OAuth accounts', async () => {
      // Arrange
      const email = 'google@example.com';
      const oauthUser = { ...mockUser, oauthProvider: 'google' };
      prisma.user.findUnique.mockResolvedValue(oauthUser);

      // Act
      const result = await service.forgotPassword(email);

      // Assert
      expect(result).toHaveProperty('message');
      expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      // Arrange
      const token = 'valid-reset-token';
      const newPassword = 'NewPassword123!';
      const hashedResetToken = await bcrypt.hash(token, 10);

      prisma.user.findMany.mockResolvedValue([
        { ...mockUser, refreshToken: hashedResetToken },
      ]);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true) as any);
      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      const result = await service.resetPassword(token, newPassword);

      // Assert
      expect(result).toHaveProperty('message');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: expect.objectContaining({
          password: expect.any(String),
          refreshToken: null,
        }),
      });
    });

    it('should throw BadRequestException for invalid token', async () => {
      // Arrange
      const token = 'invalid-token';
      const newPassword = 'NewPassword123!';

      prisma.user.findMany.mockResolvedValue([mockUser]);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false) as any);

      // Act & Assert
      await expect(service.resetPassword(token, newPassword)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Logout Tests
  // ──────────────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('should clear refresh token on logout', async () => {
      // Arrange
      const userId = 1;
      prisma.user.update.mockResolvedValue(mockUser);

      // Act
      await service.logout(userId);

      // Assert
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { refreshToken: null },
      });
    });
  });
});
