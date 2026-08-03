import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  // POST /donations - create Payment Intent (auth optional for anonymous donations)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  createDonation(@Req() req: Request, @Body() dto: CreateDonationDto) {
    const user = req.user as { userId: number } | undefined;
    return this.donationsService.createDonation(dto, user?.userId);
  }

  // GET /donations/me - get my donation history (auth required)
  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMyDonations(@Req() req: Request) {
    const user = req.user as { userId: number };
    return this.donationsService.getMyDonations(user.userId);
  }
}
