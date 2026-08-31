import { useEffect, useState } from 'react';
import { useEntitlements } from '../Hooks/useEntitlements';
import api from '../services/api';

type Ad = {
  id: number;
  title: string;
  imageUrl: string;
  targetUrl: string;
  partner: string | null;
};

type Props = {
  placement: string;
};

export default function AdSlot({ placement }: Props) {
  const { has, loading: entitlementsLoading } = useEntitlements();
  const adsFree = has('ads_free');
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entitlementsLoading) {
      return;
    }

    if (adsFree) {                            // <-- on lit le booléen
      setAd(null);
      setLoading(false);
      return;
    }

    if (has('ads_free')) {
      setAd(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadAd = async () => {
      setLoading(true);
      try {
        const response = await api.get<Ad>('/ads', {
          params: { placement },
          validateStatus: (status) => status === 200 || status === 204,
        });

        if (cancelled || response.status === 204 || !response.data) {
          setAd(null);
          return;
        }

        setAd(response.data);

        await api.post(`/ads/${response.data.id}/event`, {
          type: 'impression',
        });
      } catch {
        if (!cancelled) {
          setAd(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadAd();

    return () => {
      cancelled = true;
    };
  }, [placement, adsFree, entitlementsLoading]);

  if (entitlementsLoading || loading || !ad) {
    return null;
  }

  const handleClick = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    try {
      await api.post(`/ads/${ad.id}/event`, {
        type: 'click',
      });
    } catch {
      // Ignore tracking failures to keep navigation fluid.
    }

    window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="my-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-2">
        <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
          Sponsorisé
        </span>
      </div>
      <a
        href={ad.targetUrl}
        target="_blank"
        rel="noopener noreferrer nofollow sponsored"
        onClick={handleClick}
        className="flex w-full flex-col gap-4 p-4 text-left transition hover:bg-gray-50 sm:flex-row sm:items-center"
      >
        <div className="overflow-hidden rounded-xl bg-gray-100 sm:h-28 sm:w-44 sm:flex-none">
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-48 w-full object-cover sm:h-full"
            loading="lazy"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">{ad.title}</p>
          <p className="mt-1 text-sm text-gray-600">{ad.partner ?? 'Partenaire Earthway'}</p>
          <p className="mt-2 text-sm text-emerald-700 underline decoration-emerald-300 underline-offset-2">
            Découvrir l'offre
          </p>
        </div>
      </a>
    </section>
  );
}
