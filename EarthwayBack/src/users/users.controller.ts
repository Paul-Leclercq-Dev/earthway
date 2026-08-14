import { Controller, Get, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateEmailPreferencesDto } from './dto/update-email-preferences.dto';
import { ImpactService } from '../impact/impact.service';
import { EntitlementsService } from '../entitlements/entitlements.service';
import { UserEntitlementsResponseDto } from './dto/user-entitlements.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly impactService: ImpactService,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Request() req) {
    return this.usersService.getMe(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/entitlements')
  async getMyEntitlements(@Request() req): Promise<UserEntitlementsResponseDto> {
    const entitlements = await this.entitlementsService.resolveForUser(req.user.id);
    const tier = await this.usersService.getCurrentTier(req.user.id);

    return {
      entitlements,
      tier,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  updateMe(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/progression')
  getProgression(@Request() req) {
    return this.impactService.calculateProgression(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/email-preferences')
  getEmailPreferences(@Request() req) {
    return this.usersService.getEmailPreferences(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/email-preferences')
  updateEmailPreferences(@Request() req, @Body() dto: UpdateEmailPreferencesDto) {
    return this.usersService.updateEmailPreferences(req.user.id, dto);
  }
}
