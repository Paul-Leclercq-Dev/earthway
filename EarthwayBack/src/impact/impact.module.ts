import { Module } from '@nestjs/common';
import { ImpactService } from './impact.service';
import { ImpactController } from './impact.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ImpactController],
  providers: [ImpactService],
  exports: [ImpactService],
})
export class ImpactModule {}
