import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class AffiliateService {
  private readonly logger = new Logger(AffiliateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Build the final affiliate URL by injecting network-specific tracking params
   */
  buildAffiliateUrl(baseUrl: string, network: string, trackingParamsJson: string): string {
    let params: Record<string, string> = {};
    try {
      params = JSON.parse(trackingParamsJson);
    } catch {
      this.logger.warn(`Invalid trackingParams JSON for baseUrl: ${baseUrl}`);
    }

    if (Object.keys(params).length === 0) return baseUrl;

    const url = new URL(baseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return url.toString();
  }

  /**
   * Find affiliate link by slug and return redirect URL
   */
  async resolveLink(slug: string): Promise<string> {
    const link = await this.prisma.affiliateLink.findUnique({
      where: { slug },
    });

    if (!link || !link.isActive) {
      throw new NotFoundException(`Affiliate link "${slug}" not found or inactive`);
    }

    return this.buildAffiliateUrl(link.baseUrl, link.network, link.trackingParams);
  }

  /**
   * Log a click asynchronously (fire and forget — do not await in controller)
   */
  async logClick(
    slug: string,
    userId: number | null,
    ip: string | null,
    userAgent: string | null,
    referrer: string | null,
  ): Promise<void> {
    const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
    if (!link) return;

    // Hash the IP for RGPD compliance
    const ipHash = ip
      ? crypto.createHash('sha256').update(ip).digest('hex')
      : null;

    await this.prisma.affiliateClickLog.create({
      data: {
        affiliateLinkId: link.id,
        userId: userId ?? null,
        ipHash,
        referrer: referrer?.slice(0, 500) ?? null,
        userAgent: userAgent?.slice(0, 300) ?? null,
      },
    });
  }

  /**
   * Get click stats for a specific link (for admin / analytics)
   */
  async getClickStats(slug: string): Promise<{ slug: string; totalClicks: number; last30Days: number }> {
    const link = await this.prisma.affiliateLink.findUnique({ where: { slug } });
    if (!link) throw new NotFoundException(`Affiliate link "${slug}" not found`);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [totalClicks, last30Days] = await Promise.all([
      this.prisma.affiliateClickLog.count({ where: { affiliateLinkId: link.id } }),
      this.prisma.affiliateClickLog.count({
        where: { affiliateLinkId: link.id, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return { slug, totalClicks, last30Days };
  }
}
