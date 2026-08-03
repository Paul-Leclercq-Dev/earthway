export enum DonationCause {
  TREES = 'trees',
  CORALS = 'corals',
  POLLINATORS = 'pollinators',
  GENERAL = 'general',
}

export enum DonationStatus {
  SUCCEEDED = 'succeeded',
  PENDING = 'pending',
  FAILED = 'failed',
}

export interface Donation {
  id: number;
  userId: number;
  ongId: number;
  amount: number;
  stripePaymentIntentId?: string;
  cause: DonationCause;
  status: DonationStatus;
  date: string;
  createdAt: string;
  updatedAt: string;
}
