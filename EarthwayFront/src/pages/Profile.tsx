import { useEffect, useState } from 'react';
import { useAuth } from '../Hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import ImpactDashboard from '../components/ImpactDashboard';
import ConfirmModal from '../components/ConfirmModal';
import ProgressionBar from '../components/ProgressionBar';
import api from '../services/api';
import { fetchProgression, Progression } from '../services/progressionService';

interface EmailPreferences {
  newsletter: boolean;
  impact: boolean;
  confirmations: boolean;
  marketing: boolean;
}

interface UserProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  photoUrl?: string;
  createdAt: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  subscription?: {
    id: number;
    name: string;
    tier: string;
    status: string;
    currentPeriodEnd: string;
  } | null;
  donations: Array<{
    id: number;
    amount: number;
    cause: string;
    status: string;
    date: string;
  }>;
}

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [progression, setProgression] = useState<Progression | null>(null);
  const [emailPrefs, setEmailPrefs] = useState<EmailPreferences | null>(null);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    emailNotifications: true,
    pushNotifications: true,
  });

  useEffect(() => {
    Promise.all([
      api.get<UserProfile>('/users/me'),
      fetchProgression().catch(() => null),
      api.get<EmailPreferences>('/users/me/email-preferences').catch(() => null),
    ])
      .then(([profileRes, progressionData, prefsRes]) => {
        setProfile(profileRes.data);
        if (progressionData) setProgression(progressionData);
        if (prefsRes) setEmailPrefs(prefsRes.data);
        setFormData({
          firstName: profileRes.data.firstName,
          lastName: profileRes.data.lastName,
          emailNotifications: profileRes.data.emailNotifications ?? true,
          pushNotifications: profileRes.data.pushNotifications ?? true,
        });
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = await api.put<UserProfile>('/users/me', formData);
      setProfile({ ...profile!, ...updated.data });
      setEditing(false);
    } catch {
      alert('Erreur lors de la mise à jour');
    }
  };

  const handleCancelSubscription = async () => {
    if (!profile?.subscription) return;

    setCancellingSubscription(true);
    try {
      await api.delete(`/subscriptions/${profile.subscription.id}`);
      // Refresh profile data
      const response = await api.get<UserProfile>('/users/me');
      setProfile(response.data);
      setShowCancelModal(false);
      alert('Votre abonnement a été annulé. Il restera actif jusqu\'à la fin de votre période de facturation actuelle.');
    } catch (error) {
      alert('Erreur lors de l\'annulation de l\'abonnement. Veuillez réessayer.');
    } finally {
      setCancellingSubscription(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) return null;

  const causeLabels: Record<string, string> = {
    trees: 'Reforestation',
    corals: 'Océans',
    pollinators: 'Pollinisateurs',
    general: 'Don général',
  };

  const memberSince = new Date(profile.createdAt).getFullYear();

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-xl">
        <div className="flex items-center gap-6">
          {profile.photoUrl ? (
            <img
              src={profile.photoUrl}
              alt="Avatar"
              className="w-24 h-24 rounded-full border-4 border-white/40 object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full border-4 border-white/40 bg-white/20 flex items-center justify-center text-4xl font-bold">
              {profile.firstName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-bold">
              {profile.firstName} {profile.lastName}
            </h1>
            <p className="text-emerald-100 mt-1">{profile.email}</p>
            <p className="text-sm text-emerald-200 mt-3">Membre depuis {memberSince} 🌱</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="px-5 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg font-medium transition"
          >
            Déconnexion
          </button>
        </div>
      </div>

      {/* Progression / Gamification */}
      {progression && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Ma progression</h2>
          <ProgressionBar
            level={progression.level}
            levelTitle={progression.levelTitle}
            currentXP={progression.xp}
            nextLevelXP={progression.nextLevelXP}
            progress={progression.progress}
          />
        </div>
      )}

      {/* Subscription status */}
      {profile.subscription && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Abonnement actif</h2>
          <div className="flex items-center justify-between">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium text-sm uppercase">
                {profile.subscription.tier}
              </span>
              <p className="text-sm text-gray-500 mt-2">
                Prochain renouvlement :{' '}
                {new Date(profile.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <button
              onClick={() => navigate('/subscriptions')}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
            >
              Gérer
            </button>
          </div>
        </div>
      )}

      {/* Impact Dashboard */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Mon impact environnemental</h2>
        <ImpactDashboard />
      </div>

      {/* Edit profile */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">Informations personnelles</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Modifier
            </button>
          )}
        </div>
        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailNotifications}
                  onChange={(e) =>
                    setFormData({ ...formData, emailNotifications: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Recevoir les notifications par email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pushNotifications}
                  onChange={(e) =>
                    setFormData({ ...formData, pushNotifications: e.target.checked })
                  }
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-sm text-gray-700">Recevoir les notifications push</span>
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
              >
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition"
              >
                Annuler
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>Nom complet :</strong> {profile.firstName} {profile.lastName}
            </p>
            <p>
              <strong>Email :</strong> {profile.email}
            </p>
            <p>
              <strong>Notifications email :</strong>{' '}
              {profile.emailNotifications ? 'Activées' : 'Désactivées'}
            </p>
            <p>
              <strong>Notifications push :</strong>{' '}
              {profile.pushNotifications ? 'Activées' : 'Désactivées'}
            </p>
          </div>
        )}
      </div>

      {/* Email preferences */}
      <div id="email-preferences" className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">Préférences email</h2>
        <p className="text-sm text-gray-500 mb-4">Choisissez les emails que vous souhaitez recevoir d'Earthway.</p>
        {emailPrefs ? (
          <fieldset>
            <legend className="sr-only">Préférences de notifications par email</legend>
            <div className="space-y-3">
              {([
                { key: 'newsletter', label: 'Newsletter', desc: 'Actualités et nouvelles fonctionnalités' },
                { key: 'impact', label: 'Récapitulatif d\'impact', desc: 'Votre bilan mensuel environnemental' },
                { key: 'confirmations', label: 'Confirmations', desc: 'Reçus de dons et confirmations de paiement' },
                { key: 'marketing', label: 'Offres promotionnelles', desc: 'Promotions et offres spéciales' },
              ] as const).map(({ key, label, desc }) => (
                <label key={key} className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={emailPrefs[key]}
                    onChange={async (e) => {
                      const updated = { ...emailPrefs, [key]: e.target.checked };
                      setEmailPrefs(updated);
                      setSavingPrefs(true);
                      try {
                        await api.put('/users/me/email-preferences', { [key]: e.target.checked });
                      } catch {
                        setEmailPrefs(emailPrefs); // revert on error
                      } finally {
                        setSavingPrefs(false);
                      }
                    }}
                    className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    aria-describedby={`pref-desc-${key}`}
                  />
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-gray-800 group-hover:text-emerald-700">
                      {label}
                    </span>
                    <span id={`pref-desc-${key}`} className="block text-xs text-gray-500 mt-0.5">
                      {desc}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {savingPrefs && (
              <p className="text-xs text-emerald-600 mt-3" aria-live="polite">Enregistrement...</p>
            )}
          </fieldset>
        ) : (
          <p className="text-sm text-gray-400">Chargement des préférences...</p>
        )}
      </div>

      {/* Recent donations */}
      {profile.donations && profile.donations.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Mes dons récents</h2>
          <div className="space-y-3">
            {profile.donations.map((donation) => (
              <div
                key={donation.id}
                className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {causeLabels[donation.cause] ?? donation.cause}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(donation.date).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600">{(donation.amount / 100).toFixed(2)} €</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      donation.status === 'succeeded'
                        ? 'bg-green-100 text-green-700'
                        : donation.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {donation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/donations')}
            className="mt-4 w-full py-3 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition"
          >
            Faire un nouveau don
          </button>
        </div>
      )}

      {/* Cancel subscription modal */}
      <ConfirmModal
        isOpen={showCancelModal}
        title="Annuler votre abonnement"
        message="Êtes-vous sûr de vouloir annuler votre abonnement ? Vous continuerez à bénéficier de vos avantages jusqu'à la fin de votre période de facturation actuelle."
        confirmText={cancellingSubscription ? 'Annulation...' : 'Oui, annuler'}
        cancelText="Non, conserver"
        variant="danger"
        onConfirm={handleCancelSubscription}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
