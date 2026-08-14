import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../prisma/prisma.module';
import { EntitlementsService } from './entitlements.service';
import { EntitlementsGuard } from './entitlements.guard';

@Module({
  imports: [PrismaModule],
  providers: [
    EntitlementsService,
    {
      provide: APP_GUARD,
      useClass: EntitlementsGuard,
    },
  ],
  exports: [EntitlementsService],
})
export class EntitlementsModule {}
