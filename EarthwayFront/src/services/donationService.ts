import api from './api';

export interface CreateDonationPayload {
  amount: number; // in cents
  cause: 'trees' | 'corals' | 'pollinators' | 'general';
}

export interface DonationResponse {
  clientSecret: string;
  donationId: number;
}

export interface Donation {
  id: number;
  amount: number;
  cause: 'trees' | 'corals' | 'pollinators' | 'general';
  status: 'succeeded' | 'pending' | 'failed';
  createdAt: string;
  stripePaymentIntentId: string;
}

export const donationService = {
  createDonation: (payload: CreateDonationPayload) =>
    api.post<DonationResponse>('/donations', payload),

  getMyDonations: () => api.get<Donation[]>('/donations/me'),
};
