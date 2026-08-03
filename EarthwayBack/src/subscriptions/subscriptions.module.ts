import { Module } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { StripeProvider } from '../config/stripe.provider';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, StripeProvider],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
