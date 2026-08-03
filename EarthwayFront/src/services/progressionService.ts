import api from './api';

export interface Progression {
  xp: number;
  level: number;
  levelTitle: string;
  nextLevelXP: number | null;
  progress: number; // percentage (0-100)
  leveledUp?: boolean;
  oldLevel?: number;
}

/**
 * Get user progression (XP, level, progress)
 */
export const fetchProgression = async (): Promise<Progression> => {
  const response = await api.get<Progression>('/users/me/progression');
  return response.data;
};

export default {
  fetchProgression,
};
