import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionTierDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // GET /subscriptions - list available tiers (public)
  @Get()
  getAvailableTiers() {
    return this.subscriptionsService.getAvailableTiers();
  }

  // GET /subscriptions/me - current user subscription
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMySubscription(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.subscriptionsService.getMySubscription(user.userId);
  }

  // POST /subscriptions - create Stripe Checkout session
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  createSubscription(@Req() req: Request, @Body() dto: CreateSubscriptionDto) {
    const user = req.user as { userId: number };
    return this.subscriptionsService.createSubscription(user.userId, dto);
  }

  // DELETE /subscriptions/:id - cancel subscription
  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  upgradeSubscription(@Req() req: Request, @Body() dto: UpdateSubscriptionTierDto) {
    const user = req.user as { userId: number };
    return this.subscriptionsService.upgradeSubscriptionTier(user.userId, dto.tier);
  }

  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  downgradeSubscription(@Req() req: Request, @Body() dto: UpdateSubscriptionTierDto) {
    const user = req.user as { userId: number };
    return this.subscriptionsService.downgradeSubscriptionTier(user.userId, dto.tier);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  cancelSubscription(
    @Req() req: Request,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const user = req.user as { userId: number };
    return this.subscriptionsService.cancelSubscription(user.userId, id);
  }
}
