import { AffiliateInfo } from '../services/marketplaceService';

const NETWORK_LABELS: Record<string, string> = {
  shareasale: 'ShareASale',
  awin: 'Awin',
  affilizz: 'Affilizz',
  amazon: 'Amazon',
  direct: 'Partenaire',
};

const NETWORK_COLORS: Record<string, string> = {
  shareasale: 'bg-orange-50 text-orange-700 border-orange-200',
  awin: 'bg-blue-50 text-blue-700 border-blue-200',
  affilizz: 'bg-purple-50 text-purple-700 border-purple-200',
  amazon: 'bg-amber-50 text-amber-700 border-amber-200',
  direct: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface Props {
  /** Affiliate slug for server-side tracked redirect */
  slug?: string | null;
  /** Fallback direct URL (used when no affiliateLink) */
  fallbackUrl?: string;
  affiliateInfo?: AffiliateInfo | null;
  className?: string;
  label?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function AffiliateLinkButton({
  slug,
  fallbackUrl,
  affiliateInfo,
  className = '',
  label = 'Acheter',
}: Props) {
  const hasTrackedLink = slug && affiliateInfo?.isActive;
  const href = hasTrackedLink
    ? `${API_BASE}/affiliate/redirect/${slug}`
    : fallbackUrl;

  if (!href) return null;

  const networkLabel = affiliateInfo?.network
    ? NETWORK_LABELS[affiliateInfo.network]
    : null;
  const networkColor = affiliateInfo?.network
    ? NETWORK_COLORS[affiliateInfo.network]
    : NETWORK_COLORS.direct;

  return (
    <div className="flex flex-col items-end gap-1">
      {networkLabel && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full border font-medium ${networkColor}`}
          title={`Via le réseau d'affiliation ${networkLabel}`}
        >
          {networkLabel}
        </span>
      )}
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition ${className}`}
        aria-label={`${label} (lien affilié, s'ouvre dans un nouvel onglet)`}
      >
        {label}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
      </a>
    </div>
  );
}
