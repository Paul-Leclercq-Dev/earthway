import { useEffect, useState } from 'react';
import { impactService } from '../services/impactService';
import { Impact } from '../types/impact';

export function useImpact() {
  const [impact, setImpact] = useState<Impact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    impactService
      .getMyImpact()
      .then(setImpact)
      .catch(() => setError('Impossible de charger votre impact'))
      .finally(() => setLoading(false));
  }, []);

  return { impact, loading, error };
}
