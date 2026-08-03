import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ImpactService } from './impact.service';
import { ImpactDto } from './dto/impact.dto';

@Controller('impact')
export class ImpactController {
  constructor(private readonly impactService: ImpactService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyImpact(@Request() req): Promise<ImpactDto> {
    return this.impactService.getMyImpact(req.user.id);
  }
}
