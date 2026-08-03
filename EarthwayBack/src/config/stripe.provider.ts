import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

/**
 * StripeProvider - Wrapper injectable pour Stripe SDK
 * 
 * Avantages :
 * 1. Facilite le mocking dans les tests (injection de dépendance)
 * 2. Centralise la configuration Stripe
 * 3. Permet de réutiliser l'instance dans différents services
 */
@Injectable()
export class StripeProvider {
  public readonly stripe: Stripe;

  constructor(private config: ConfigService) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY') || 'sk_test_placeholder';
    this.stripe = new Stripe(stripeKey, {
      apiVersion: '2026-02-25.clover',
    });
  }

  /**
   * Méthodes helper pour accès direct aux ressources Stripe
   */
  get checkout() {
    return this.stripe.checkout;
  }

  get subscriptions() {
    return this.stripe.subscriptions;
  }

  get customers() {
    return this.stripe.customers;
  }

  get paymentIntents() {
    return this.stripe.paymentIntents;
  }

  get webhooks() {
    return this.stripe.webhooks;
  }
}
