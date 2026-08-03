import { useConsent } from '../Hooks/useConsent';

export default function ConsentBanner() {
  const { consent, grantConsent, denyConsent } = useConsent();

  // Don't show if user already decided
  if (consent !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Gestion des cookies et publicités"
      aria-modal="false"
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-xl"
    >
      <div className="container mx-auto px-4 py-4 max-w-5xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-semibold">🍃 Earthway utilise des cookies publicitaires</span>{' '}
              pour financer la plateforme et continuer à agir pour la planète.
              Les revenus publicitaires nous permettent de proposer un accès gratuit.{' '}
              <a
                href="/privacy"
                className="text-emerald-600 underline hover:text-emerald-700"
                target="_blank"
                rel="noopener noreferrer"
              >
                En savoir plus
              </a>
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <button
              onClick={denyConsent}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 hover:bg-gray-50 rounded-lg transition"
              aria-label="Refuser les publicités personnalisées"
            >
              Refuser
            </button>
            <button
              onClick={grantConsent}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
              aria-label="Accepter les publicités pour soutenir Earthway"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
