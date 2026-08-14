import React from 'react';
import Gate from './Gate';

const Upsell = () => (
  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
    Ce contenu premium nécessite un abonnement Premium +.
  </div>
);

export const EntitlementsExample: React.FC = () => {
  return (
    <Gate need="premium_news" fallback={<Upsell />}>
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        Contenu premium visible : analyse avancée, accès exclusif, actualités premium.
      </div>
    </Gate>
  );
};

export default EntitlementsExample;
