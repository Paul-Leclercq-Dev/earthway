import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { existsSync } from 'fs';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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
import { EntitlementsModule } from './entitlements/entitlements.module';
import { AdsModule } from './ads/ads.module';

const isDockerRuntime = existsSync('/.dockerenv');
const envRedisHost = process.env.REDIS_HOST || 'localhost';
const resolvedRedisHost = !isDockerRuntime && envRedisHost === 'redis' ? '127.0.0.1' : envRedisHost;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        genReqId: (req, res) => {
          const headerRequestId = req.headers['x-request-id'];
          const requestId = typeof headerRequestId === 'string' && headerRequestId.length > 0
            ? headerRequestId
            : randomUUID();
          res.setHeader('x-request-id', requestId);
          return requestId;
        },
        customLogLevel: (_req, res, err) => {
          if (res.statusCode >= 500 || err) {
            return 'error';
          }
          if (res.statusCode >= 400) {
            return 'warn';
          }
          return 'info';
        },
        customProps: (req) => {
          const isStripeWebhook = req.url?.includes('/webhooks/stripe') || false;
          const isPaymentRoute = req.url?.includes('/subscriptions') || req.url?.includes('/donations') || false;
          const sentryEnabled = Boolean(process.env.SENTRY_DSN);

          return {
            requestId: req.id,
            routeCategory: isStripeWebhook ? 'stripe_webhook' : isPaymentRoute ? 'payment' : 'app',
            stripeSignaturePresent: isStripeWebhook ? Boolean(req.headers['stripe-signature']) : undefined,
            sentryEnabled,
          };
        },
        customErrorObject: (req, res, err, loggableObject) => {
          const isStripeWebhook = req.url?.includes('/webhooks/stripe') || false;
          const isPaymentRoute = req.url?.includes('/subscriptions') || req.url?.includes('/donations') || false;

          return {
            ...loggableObject,
            requestId: req.id,
            routeCategory: isStripeWebhook ? 'stripe_webhook' : isPaymentRoute ? 'payment' : 'app',
            webhookContext: isStripeWebhook
              ? {
                  stripeSignaturePresent: Boolean(req.headers['stripe-signature']),
                  contentType: req.headers['content-type'] || null,
                  userAgent: req.headers['user-agent'] || null,
                }
              : undefined,
            errorContext: {
              name: err.name,
              message: err.message,
              stack: err.stack,
            },
            statusCode: res.statusCode,
          };
        },
      },
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 1 minute window
      limit: 180,  // permissive default for normal browsing and public reads
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
    EntitlementsModule,
    AdsModule,
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