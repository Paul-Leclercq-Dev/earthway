export type StripeErrorLike = {
  code?: string;
  message?: string;
  type?: string;
};

const STRIPE_ERROR_MESSAGES: Record<string, string> = {
  card_declined: 'Votre carte a été refusée. Vérifiez votre carte ou essayez un autre moyen de paiement.',
  insufficient_funds: 'Le paiement a été refusé car le solde disponible sur votre carte est insuffisant.',
  expired_card: 'Votre carte est expirée. Vérifiez sa date d’expiration et réessayez.',
  incorrect_cvc: 'Le code de sécurité de votre carte est incorrect. Vérifiez le CVC puis réessayez.',
  authentication_required: 'Une vérification supplémentaire est requise par votre banque pour finaliser le paiement.',
  payment_intent_authentication_failure: 'Une vérification supplémentaire est requise par votre banque pour finaliser le paiement.',
  processing_error: 'Le paiement n’a pas pu être traité pour le moment. Merci de réessayer dans quelques instants.',
};

export function mapStripeError(error: unknown): { code: string; message: string } {
  const record = (typeof error === 'object' && error !== null ? error : {}) as StripeErrorLike;
  const code = typeof record.code === 'string' && record.code ? record.code : 'unknown_error';
  const mappedMessage = STRIPE_ERROR_MESSAGES[code] ??
    (typeof record.message === 'string' && record.message.trim() ? record.message : 'Le paiement n’a pas pu être traité. Merci de réessayer ou de contacter votre banque.');

  return {
    code,
    message: mappedMessage,
  };
}
