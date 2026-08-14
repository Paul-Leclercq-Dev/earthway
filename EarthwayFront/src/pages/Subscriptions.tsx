import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../Hooks/useAuth';
import { subscriptionService, SubscriptionTier } from '../services/subscriptionService';

const TIER_ICONS: Record<string, string> = {
  basic: '🌱',
  premium: '🌿',
  vip: '🌳',
};

const TIER_COLORS: Record<string, { bg: string; border: string; cta: string; badge: string }> = {
  basic: {
    bg: 'bg-white',
    border: 'border-gray-200',
    cta: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    badge: '',
  },
  premium: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    cta: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  vip: {
    bg: 'bg-white',
    border: 'border-amber-300',
    cta: 'bg-amber-500 hover:bg-amber-600 text-white',
    badge: 'bg-amber-100 text-amber-700',
  },
};

const Subscriptions: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkoutStatus = searchParams.get('checkout');
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const load = async () => {
      try {
        const { data: tierData } = await subscriptionService.getAvailableTiers();
        setTiers(tierData);

        if (isAuthenticated) {
          const { data: sub } = await subscriptionService.getMySubscription();
          setCurrentSub(sub);
        }
      } catch {
        setError('Impossible de charger les abonnements. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isAuthenticated]);

  const handleSubscribe = async (tier: SubscriptionTier) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/subscriptions' } });
      return;
    }

    setSubscribing(tier.id);
    setError(null);

    try {
      const { data } = await subscriptionService.createSubscription(
        tier.id,
        tier.stripePriceId,
      );
      // Redirect to Stripe Checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      const payload = err?.response?.data;
      const code = typeof payload?.code === 'string' ? payload.code : 'unknown_error';
      const message = typeof payload?.message === 'string'
        ? payload.message
        : 'Une erreur est survenue.';
      setError(`${message} ${code !== 'unknown_error' ? `(${code})` : ''}`.trim());
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasActiveSub = currentSub?.status === 'active';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pt-16 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choisissez votre engagement
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            <strong className="text-emerald-600">75% de votre abonnement</strong> est directement
            reversé aux ONG partenaires pour financer des projets concrets.
          </p>
        </div>

        {/* Active subscription banner */}
        {hasActiveSub && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-10 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-emerald-800">
                Abonnement actif : {currentSub.name}
              </p>
              <p className="text-sm text-emerald-600">
                Prochain prélèvement le{' '}
                {new Date(currentSub.currentPeriodEnd).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        )}

        {checkoutStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 mb-8">
            <p className="font-semibold text-emerald-800">Paiement Checkout confirmé</p>
            <p className="text-sm text-emerald-700 mt-1">
              Stripe a géré l'authentification forte si nécessaire. L'abonnement sera reflété ici dès confirmation du paiement par webhook.
            </p>
            {sessionId && <p className="text-xs text-emerald-600 mt-2">Session: {sessionId}</p>}
          </div>
        )}

        {checkoutStatus === 'cancelled' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 text-amber-800">
            Le paiement a été annulé avant confirmation. Vous pouvez relancer la souscription à tout moment.
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-8 text-sm">
            {error}
          </div>
        )}

        {/* Pricing tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => {
            const colors = TIER_COLORS[tier.id] ?? TIER_COLORS.basic;
            const isCurrentTier = currentSub?.tier === tier.id && hasActiveSub;
            const isPopular = tier.id === 'premium';

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col rounded-2xl border-2 ${colors.border} ${colors.bg} shadow-sm p-8 transition-transform hover:-translate-y-1`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                      Le plus populaire
                    </span>
                  </div>
                )}

                {/* Icon + name */}
                <div className="text-center mb-6">
                  <span className="text-4xl">{TIER_ICONS[tier.id] ?? '🌿'}</span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">{tier.name}</h2>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <span className="text-5xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-500 ml-1">€/mois</span>
                </div>

                {/* Features */}
                <ul className="space-y-3 flex-1 mb-8">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={!!subscribing || isCurrentTier}
                  className={`w-full py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 ${colors.cta}`}
                >
                  {isCurrentTier
                    ? 'Abonnement actuel'
                    : subscribing === tier.id
                    ? 'Redirection...'
                    : isAuthenticated
                    ? "S'abonner"
                    : 'Commencer'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Trust signals */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          {[
            { icon: '🔒', title: 'Paiement sécurisé', desc: 'Via Stripe — aucune donnée bancaire stockée' },
            { icon: '↩️', title: 'Résiliation libre', desc: 'Annulez à tout moment sans engagement' },
            { icon: '🌍', title: 'Impact certifié', desc: 'Projets vérifiés par des ONG partenaires' },
          ].map((item) => (
            <div key={item.title} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <span className="text-2xl">{item.icon}</span>
              <p className="font-semibold text-gray-900 mt-2 text-sm">{item.title}</p>
              <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
