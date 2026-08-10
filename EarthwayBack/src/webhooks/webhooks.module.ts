import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeProvider } from '../config/stripe.provider';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DonationsModule } from '../donations/donations.module';
import { ImpactModule } from '../impact/impact.module';
import { WebhooksProcessor } from './webhooks.processor';

@Module({
  imports: [
    PrismaModule,
    SubscriptionsModule,
    DonationsModule,
    ImpactModule,
    BullModule.registerQueue({
      name: 'webhooks',
      defaultJobOptions: {
        attempts: 5,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, StripeProvider, WebhooksProcessor],
})
export class WebhooksModule {}
