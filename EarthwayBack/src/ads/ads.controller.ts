import {
  Body,
  Controller,
  Get,
  Headers,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AdsService } from './ads.service';
import { GetAdsQueryDto } from './dto/get-ads.query.dto';
import { CreateAdEventDto } from './dto/create-ad-event.dto';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SkipThrottle } from '@nestjs/throttler';

type AuthenticatedRequest = Request & {
  user?: {
    id?: number;
    userId?: number;
  };
};

@Controller('ads')
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  @Get()
  @SkipThrottle()
  @UseGuards(OptionalJwtAuthGuard)
  async getAd(
    @Query() query: GetAdsQueryDto,
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? null;
    const ad = await this.adsService.getAdForPlacement(query.placement, userId);

    if (!ad) {
      res.status(HttpStatus.NO_CONTENT);
      return;
    }

    return ad;
  }

  @Post(':id/event')
  @UseGuards(OptionalJwtAuthGuard)
  async trackEvent(
    @Param('id', ParseIntPipe) adId: number,
    @Body() dto: CreateAdEventDto,
    @Headers('x-analytics-consent') analyticsConsentHeader: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.id ?? req.user?.userId ?? null;
    const analyticsConsent = ['1', 'true', 'granted', 'yes'].includes(
      (analyticsConsentHeader ?? '').toLowerCase(),
    );
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? null;

    await this.adsService.createEvent(adId, dto.type, {
      userId,
      analyticsConsent,
      ip,
      referrer: req.headers.referer ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return { ok: true };
  }
}
