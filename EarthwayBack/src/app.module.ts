import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { existsSync } from 'fs';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MailModule } from './mail/mail.module';
import { BullModule } from '@nestjs/bull';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { NewsModule } from './news/news.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { DonationsModule } from './donations/donations.module';
import { ImpactModule } from './impact/impact.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { UsersModule } from './users/users.module';
import { MarketplaceModule } from './marketplace/marketplace.module';
import { AffiliateModule } from './affiliate/affiliate.module';

const isDockerRuntime = existsSync('/.dockerenv');
const envRedisHost = process.env.REDIS_HOST || 'localhost';
const resolvedRedisHost = !isDockerRuntime && envRedisHost === 'redis' ? '127.0.0.1' : envRedisHost;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 60,  // 60 requests per minute (general)
    }]),
    ScheduleModule.forRoot(),
    BullModule.forRoot({
      redis: {
        host: resolvedRedisHost,
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        retryStrategy: () => null,
      },
    }),
    PrismaModule,
    AuthModule,
    MailModule,
    NewsModule,
    SubscriptionsModule,
    DonationsModule,
    ImpactModule,
    WebhooksModule,
    MarketplaceModule,
    UsersModule,
    AffiliateModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}