import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationService } from '../services/donationService';

type Cause = 'trees' | 'corals' | 'pollinators' | 'general';

const CAUSES: { id: Cause; icon: string; label: string; description: string; color: string }[] = [
  {
    id: 'trees',
    icon: '🌳',
    label: 'Reforestation',
    description: 'Planter des arbres et restaurer les forêts tropicales.',
    color: 'border-lime-400 bg-lime-50',
  },
  {
    id: 'corals',
    icon: '🪸',
    label: 'Océans & Coraux',
    description: 'Restaurer les récifs coralliens et protéger les océans.',
    color: 'border-blue-400 bg-blue-50',
  },
  {
    id: 'pollinators',
    icon: '🐝',
    label: 'Pollinisateurs',
    description: 'Sauvegarder les abeilles et insectes pollinisateurs.',
    color: 'border-amber-400 bg-amber-50',
  },
  {
    id: 'general',
    icon: '🌍',
    label: 'Cause générale',
    description: 'Soutenir l\'ensemble des projets environnementaux Earthway.',
    color: 'border-emerald-400 bg-emerald-50',
  },
];

const PRESET_AMOUNTS = [5, 10, 20, 50, 100];

const Donations: React.FC = () => {
  const navigate = useNavigate();

  const [selectedCause, setSelectedCause] = useState<Cause>('general');
  const [amountEur, setAmountEur] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const effectiveAmount = isCustom ? parseFloat(customAmount) || 0 : amountEur;

  const handlePresetClick = (val: number) => {
    setIsCustom(false);
    setAmountEur(val);
    setCustomAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveAmount < 1) {
      setError('Le montant minimum est de 1 €.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const { data } = await donationService.createDonation({
        amount: Math.round(effectiveAmount * 100),
        cause: selectedCause,
      });

      // Store client secret to confirm payment with Stripe Elements
      // For now we show a success message and redirect
      // In production, integrate @stripe/react-stripe-js here
      // const clientSecret = data.clientSecret; // Will be used later
      console.log('Payment Intent created:', data.clientSecret);
      setSuccess(true);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.';
      setError(Array.isArray(message) ? message.join(', ') : message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center pt-16 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          <span className="text-5xl">💚</span>
          <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Merci pour votre don !</h2>
          <p className="text-gray-600 mb-6">
            Votre paiement est en cours de traitement. Vous recevrez une confirmation par email.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Voir mon impact
            </button>
            <button
              onClick={() => setSuccess(false)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Faire un autre don
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white pt-16 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Faire un don ponctuel</h1>
          <p className="text-gray-600">
            Choisissez une cause et un montant. 100% de votre don va aux projets de terrain.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-8">
          {/* Cause selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choisissez une cause</h2>
            <div className="grid grid-cols-2 gap-3">
              {CAUSES.map((cause) => (
                <button
                  key={cause.id}
                  type="button"
                  onClick={() => setSelectedCause(cause.id)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    selectedCause === cause.id
                      ? cause.color + ' shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <span className="text-2xl">{cause.icon}</span>
                  <p className="font-semibold text-gray-900 mt-1 text-sm">{cause.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-tight">{cause.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Amount selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Choisissez un montant</h2>
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESET_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handlePresetClick(val)}
                  className={`px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                    !isCustom && amountEur === val
                      ? 'border-emerald-500 bg-emerald-500 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-emerald-300'
                  }`}
                >
                  {val} €
                </button>
              ))}
              <button
                type="button"
                onClick={() => setIsCustom(true)}
                className={`px-5 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                  isCustom
                    ? 'border-emerald-500 bg-emerald-500 text-white'
                    : 'border-gray-200 text-gray-700 hover:border-emerald-300'
                }`}
              >
                Autre
              </button>
            </div>
            {isCustom && (
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Montant en €"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">€</span>
              </div>
            )}
          </div>

          {/* Summary */}
          {effectiveAmount > 0 && (
            <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Votre don</p>
                <p className="font-bold text-gray-900 text-lg">{effectiveAmount} €</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Pour la cause</p>
                <p className="font-semibold text-gray-900">
                  {CAUSES.find((c) => c.id === selectedCause)?.label}
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || effectiveAmount < 1}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-4 rounded-lg transition-colors text-lg"
          >
            {loading ? 'Traitement...' : `Donner ${effectiveAmount > 0 ? effectiveAmount + ' €' : ''}`}
          </button>

          <p className="text-center text-xs text-gray-400">
            🔒 Paiement sécurisé via Stripe · Aucune donnée bancaire stockée
          </p>
        </form>
      </div>
    </div>
  );
};

export default Donations;
