import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeConfig {
  private readonly stripe: Stripe;

  constructor(private configService: ConfigService) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
    this.stripe = new Stripe(
      stripeKey,
      { apiVersion: '2026-02-25.clover' },
    );
  }

  getClient(): Stripe {
    return this.stripe;
  }
}
