import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateEmailPreferencesDto } from './dto/update-email-preferences.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: {
          select: {
            id: true,
            name: true,
            tier: true,
            status: true,
            currentPeriodEnd: true,
          },
        },
        impact: true,
        donations: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            amount: true,
            cause: true,
            status: true,
            date: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, refreshToken, ...publicUser } = user;
    return publicUser;
  }

  async updateMe(userId: number, dto: UpdateUserDto) {
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        emailVerified: true,
        photoUrl: true,
        emailNotifications: true,
        pushNotifications: true,
        oauthProvider: true,
        xp: true,
        level: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  async getEmailPreferences(userId: number) {
    const prefs = await this.prisma.emailPreference.findUnique({
      where: { userId },
    });
    // Return defaults if no preferences have been saved yet
    return prefs ?? {
      newsletter: true,
      impact: true,
      confirmations: true,
      marketing: false,
    };
  }

  async updateEmailPreferences(userId: number, dto: UpdateEmailPreferencesDto) {
    await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return this.prisma.emailPreference.upsert({
      where: { userId },
      create: { userId, ...dto },
      update: dto,
    });
  }
}
