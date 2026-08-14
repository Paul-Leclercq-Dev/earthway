import { mapStripeError } from './stripe-error.util';

describe('mapStripeError', () => {
  it('maps card_declined to a clear French message', () => {
    expect(mapStripeError({ code: 'card_declined' })).toEqual({
      code: 'card_declined',
      message: 'Votre carte a été refusée. Vérifiez votre carte ou essayez un autre moyen de paiement.',
    });
  });

  it('maps authentication_required to a retry message', () => {
    expect(mapStripeError({ code: 'authentication_required' })).toEqual({
      code: 'authentication_required',
      message: 'Une vérification supplémentaire est requise par votre banque pour finaliser le paiement.',
    });
  });

  it('falls back to a generic Stripe message', () => {
    expect(mapStripeError({ code: 'unknown_error' })).toEqual({
      code: 'unknown_error',
      message: 'Le paiement n’a pas pu être traité. Merci de réessayer ou de contacter votre banque.',
    });
  });
});
