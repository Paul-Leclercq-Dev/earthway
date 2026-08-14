import { BadGatewayException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { StripeProvider } from '../config/stripe.provider';
import { CreateDonationDto } from './dto/create-donation.dto';
import { DonationCause, DonationStatus } from '@prisma/client';
import { mapStripeError } from '../common/stripe-error.util';

const CAUSE_NAMES: Record<DonationCause, string> = {
  trees: 'Reforestation',
  corals: 'Océans & Coraux',
  pollinators: 'Pollinisateurs',
  general: 'Cause générale',
};

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mailService: MailService,
    private stripeProvider: StripeProvider,
  ) {}

  // ─── Create donation (Stripe Payment Intent) ──────────────────────────────

  async createDonation(dto: CreateDonationDto, userId?: number) {
    // Resolve default ONG id - use ongId if provided, else first ONG
    let ongId = dto.ongId;
    if (!ongId) {
      const firstOng = await this.prisma.oNG.findFirst();
      ongId = firstOng?.id ?? 1;
    }

    const stripeSecretKey = this.config.get<string>('STRIPE_SECRET_KEY') || '';
    if (!stripeSecretKey || stripeSecretKey.includes('placeholder')) {
      throw new ServiceUnavailableException(
        'Stripe is not configured. Set STRIPE_SECRET_KEY in backend environment variables.',
      );
    }

    let paymentIntent;
    try {
      paymentIntent = await this.stripeProvider.paymentIntents.create({
        amount: dto.amount,
        currency: 'eur',
        metadata: {
          cause: dto.cause,
          userId: userId ? String(userId) : 'anonymous',
        },
        automatic_payment_methods: { enabled: true },
      });
    } catch (error) {
      const stripeError = mapStripeError(error);
      this.logger.error(`Stripe PaymentIntent creation failed: ${stripeError.code} - ${stripeError.message}`);
      throw new BadGatewayException({
        code: stripeError.code,
        message: stripeError.message,
      });
    }

    const donation = await this.prisma.donation.create({
      data: {
        amount: dto.amount / 100,
        cause: dto.cause as DonationCause,
        status: DonationStatus.pending,
        stripePaymentIntentId: paymentIntent.id,
        userId: userId ?? 1, // anonymous donations linked to system user
        ongId,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      donationId: donation.id,
    };
  }

  // ─── Get my donations ─────────────────────────────────────────────────────

  async getMyDonations(userId: number) {
    return this.prisma.donation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── Sync donation status from Stripe webhook ─────────────────────────────

  async syncDonationFromStripe(
    stripePaymentIntentId: string,
    status: DonationStatus,
  ) {
    const donation = await this.prisma.donation.findUnique({
      where: { stripePaymentIntentId },
      include: { user: true },
    });

    if (!donation) return;

    const updated = await this.prisma.donation.update({
      where: { stripePaymentIntentId },
      data: { status },
    });

    // Send confirmation email on success
    if (status === DonationStatus.succeeded && donation.user) {
      try {
        await this.mailService.sendDonationConfirmationEmail(
          donation.user.email,
          donation.user.firstName,
          Number(donation.amount),
          donation.cause,
          stripePaymentIntentId,
        );
      } catch (err) {
        this.logger.warn(`Failed to send donation confirmation: ${(err as Error).message}`);
      }
    }

    return updated;
  }
}
