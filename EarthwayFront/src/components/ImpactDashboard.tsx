import { useImpact } from '../Hooks/useImpact';
import ProgressBar from './ProgressBar';

// Next-level goals
const GOALS = {
  treesPlanted: 100,
  coralRestored: 20,
  pollinatorsHelped: 50,
};

const TIER_LABELS: Record<string, string> = {
  basic: 'Basic',
  premium: 'Premium',
  vip: 'VIP',
};

export default function ImpactDashboard() {
  const { impact, loading, error } = useImpact();

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !impact) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">
        {error ?? 'Aucune donnée d\'impact disponible.'}
      </div>
    );
  }

  const memberYear = new Date(impact.memberSince).getFullYear();

  return (
    <div className="space-y-8">
      {/* Header stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={`${impact.totalDonated.toFixed(2)} €`}
          label="Total donné"
          icon="💰"
          color="bg-amber-50 border-amber-200"
        />
        <StatCard
          value={`${impact.co2Offset} kg`}
          label="CO₂ compensé"
          icon="🌍"
          color="bg-blue-50 border-blue-200"
        />
        <StatCard
          value={`${impact.donationCount}`}
          label="Dons réalisés"
          icon="🎁"
          color="bg-purple-50 border-purple-200"
        />
        <StatCard
          value={TIER_LABELS[impact.subscriptionTier ?? ''] ?? 'Aucun'}
          label="Abonnement"
          icon="⭐"
          color="bg-emerald-50 border-emerald-200"
        />
      </div>

      {/* Ecological impact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <EcoCard
          count={impact.treesPlanted}
          label="Arbres plantés"
          emoji="🌳"
          bg="from-green-500 to-emerald-600"
        />
        <EcoCard
          count={impact.coralRestored}
          label="Coraux restaurés"
          emoji="🪸"
          bg="from-cyan-500 to-blue-600"
        />
        <EcoCard
          count={impact.pollinatorsHelped}
          label="Pollinisateurs aidés"
          emoji="🐝"
          bg="from-yellow-400 to-amber-500"
        />
      </div>

      {/* Progress toward goals */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 text-lg">Progression vers vos objectifs</h3>
        <ProgressBar
          value={impact.treesPlanted}
          max={GOALS.treesPlanted}
          label="Arbres plantés"
          color="bg-emerald-500"
        />
        <ProgressBar
          value={impact.coralRestored}
          max={GOALS.coralRestored}
          label="Coraux restaurés"
          color="bg-cyan-500"
        />
        <ProgressBar
          value={impact.pollinatorsHelped}
          max={GOALS.pollinatorsHelped}
          label="Pollinisateurs aidés"
          color="bg-amber-400"
        />
      </div>

      <p className="text-center text-sm text-gray-400">
        Membre depuis {memberYear} · Merci pour votre engagement 💚
      </p>
    </div>
  );
}

function StatCard({
  value,
  label,
  icon,
  color,
}: {
  value: string;
  label: string;
  icon: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl border p-5 ${color} flex flex-col items-center text-center gap-1`}>
      <span className="text-3xl">{icon}</span>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
      <span className="text-xs text-gray-500 uppercase tracking-wide">{label}</span>
    </div>
  );
}

function EcoCard({
  count,
  label,
  emoji,
  bg,
}: {
  count: number;
  label: string;
  emoji: string;
  bg: string;
}) {
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${bg} p-6 text-white flex flex-col items-center gap-2 shadow-md`}>
      <span className="text-5xl">{emoji}</span>
      <span className="text-4xl font-extrabold">{count}</span>
      <span className="text-sm font-medium opacity-90">{label}</span>
    </div>
  );
}
