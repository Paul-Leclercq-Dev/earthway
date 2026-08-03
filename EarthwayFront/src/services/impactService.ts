import api from './api';
import { Impact } from '../types/impact';

export const impactService = {
  getMyImpact: (): Promise<Impact> =>
    api.get<Impact>('/impact/me').then((r) => r.data),
};
