import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { AdEventType } from './dto/create-ad-event.dto';
import { hashIpAddress } from '../common/privacy.util';

type AdCandidate = {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
  partner: string | null;
  weight: number;
};

export type PublicAd = {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
  partner: string | null;
};

@Injectable()
export class AdsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async getAdForPlacement(placement: string, userId?: number | null): Promise<PublicAd | null> {
    if (userId) {
      const entitlements = await this.entitlementsService.resolveForUser(userId);
      if (entitlements.includes('ads_free')) {
        return null;
      }
    }

    const now = new Date();
    const ads = await this.prisma.ad.findMany({
      where: {
        isActive: true,
        placement,
        AND: [
          {
            OR: [{ startAt: null }, { startAt: { lte: now } }],
          },
          {
            OR: [{ endAt: null }, { endAt: { gte: now } }],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        imageUrl: true,
        targetUrl: true,
        partner: true,
        weight: true,
      },
    });

    const selected = this.pickWeightedAd(ads);

    if (!selected) {
      return null;
    }

    const { weight: _weight, ...publicAd } = selected;
    return publicAd;
  }

  async createEvent(
    adId: number,
    type: AdEventType,
    options: {
      userId?: number | null;
      analyticsConsent?: boolean;
      ip?: string | null;
      referrer?: string | null;
      userAgent?: string | null;
    },
  ) {
    const ad = await this.prisma.ad.findUnique({
      where: { id: adId },
      select: { id: true },
    });

    if (!ad) {
      throw new NotFoundException('Encart introuvable.');
    }

    const analyticsConsent = options.analyticsConsent === true;
    const ipHash = analyticsConsent ? hashIpAddress(options.ip ?? null) : null;

    return this.prisma.adEvent.create({
      data: {
        adId,
        type,
        userId: options.userId ?? null,
        ipHash,
        referrer: analyticsConsent ? options.referrer?.slice(0, 500) ?? null : null,
        userAgent: analyticsConsent ? options.userAgent?.slice(0, 300) ?? null : null,
      },
    });
  }

  private pickWeightedAd(ads: AdCandidate[]): AdCandidate | null {
    if (ads.length === 0) {
      return null;
    }

    const totalWeight = ads.reduce((sum, ad) => sum + Math.max(ad.weight, 0), 0);

    if (totalWeight <= 0) {
      return ads[0] ?? null;
    }

    const threshold = Math.random() * totalWeight;
    let cursor = 0;

    for (const ad of ads) {
      cursor += Math.max(ad.weight, 0);
      if (threshold < cursor) {
        return ad;
      }
    }

    return ads[ads.length - 1] ?? null;
  }
}
