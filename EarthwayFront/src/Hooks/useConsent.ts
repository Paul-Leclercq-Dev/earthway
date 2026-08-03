import { useState, useEffect } from 'react';

type ConsentValue = 'granted' | 'denied' | null;

const STORAGE_KEY = 'earthway_ad_consent';

export function useConsent() {
  const [consent, setConsent] = useState<ConsentValue>(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY) as ConsentValue) ?? null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    try {
      if (consent !== null) {
        localStorage.setItem(STORAGE_KEY, consent);
      }
    } catch {
      // localStorage unavailable (private browsing, etc.)
    }
  }, [consent]);

  const grantConsent = () => setConsent('granted');
  const denyConsent = () => setConsent('denied');

  return { consent, grantConsent, denyConsent };
}
