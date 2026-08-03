import { Module } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { DonationsController } from './donations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MailModule } from '../mail/mail.module';
import { StripeProvider } from '../config/stripe.provider';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [DonationsController],
  providers: [DonationsService, StripeProvider],
  exports: [DonationsService],
})
export class DonationsModule {}
