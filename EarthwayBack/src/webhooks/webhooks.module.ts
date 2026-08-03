import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StripeProvider } from '../config/stripe.provider';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { DonationsModule } from '../donations/donations.module';
import { ImpactModule } from '../impact/impact.module';

@Module({
  imports: [PrismaModule, SubscriptionsModule, DonationsModule, ImpactModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, StripeProvider],
})
export class WebhooksModule {}
