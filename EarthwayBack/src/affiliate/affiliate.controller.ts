import { Controller, Get, Param, Redirect, Req, HttpCode } from '@nestjs/common';
import { Request } from 'express';
import { AffiliateService } from './affiliate.service';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('affiliate')
export class AffiliateController {
  constructor(private readonly affiliateService: AffiliateService) {}

  /**
   * T175: Deep-link redirect with click tracking
   * Opens in new tab from frontend → server resolves final URL → HTTP 302
   */
  @Get('redirect/:slug')
  @SkipThrottle() // redirects should not be throttled (legit user clicks)
  @Redirect()
  async redirect(@Param('slug') slug: string, @Req() req: Request) {
    const url = await this.affiliateService.resolveLink(slug);

    // Log click asynchronously — don't await so redirect is instant
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? null;

    void this.affiliateService.logClick(
      slug,
      (req.user as { id: number } | undefined)?.id ?? null,
      ip,
      req.headers['user-agent'] ?? null,
      req.headers['referer'] ?? null,
    );

    return { url, statusCode: 302 };
  }
}
