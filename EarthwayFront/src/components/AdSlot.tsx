import { useEffect, useRef } from 'react';
import { useConsent } from '../Hooks/useConsent';
import { useAuth } from '../Hooks/useAuth';

type AdFormat = 'in-feed' | 'display' | 'native';

interface Props {
  format: AdFormat;
  /** Slot key that maps to env var VITE_ADSENSE_SLOT_{KEY} */
  slotKey: 'FEED' | 'DISPLAY';
  className?: string;
}

const AD_PROVIDER = import.meta.env.VITE_AD_PROVIDER ?? 'none';
const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? '';
const SLOT_MAP: Record<string, string> = {
  FEED: import.meta.env.VITE_ADSENSE_SLOT_FEED ?? '',
  DISPLAY: import.meta.env.VITE_ADSENSE_SLOT_DISPLAY ?? '',
};

let adsenseScriptLoaded = false;

function loadAdSenseScript() {
  if (adsenseScriptLoaded || !ADSENSE_CLIENT) return;
  adsenseScriptLoaded = true;
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`;
  script.crossOrigin = 'anonymous';
  document.head.appendChild(script);
}

export default function AdSlot({ format, slotKey, className = '' }: Props) {
  const { consent } = useConsent();
  const { user } = useAuth();
  const adRef = useRef<HTMLModElement>(null);
  const pushed = useRef(false);

  // Rule 1: Never show ads to active subscribers
  const isSubscriber = (user as { subscription?: { status?: string } } | null)
    ?.subscription?.status === 'active';

  // Rule 2: Require explicit consent
  const canShow = consent === 'granted' && !isSubscriber && AD_PROVIDER !== 'none';

  const slotId = SLOT_MAP[slotKey] ?? '';

  useEffect(() => {
    if (!canShow || !slotId || pushed.current) return;
    if (AD_PROVIDER === 'adsense') {
      loadAdSenseScript();
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
        pushed.current = true;
      } catch {
        // AdSense not ready yet
      }
    }
    // Media.net stub — activate by setting VITE_AD_PROVIDER=medianet
    // if (AD_PROVIDER === 'medianet') { /* renderMediaNet(adRef.current, slotId) */ }
  }, [canShow, slotId]);

  if (!canShow || !slotId) return null;

  const sizeClass =
    format === 'in-feed'
      ? 'w-full min-h-[100px]'
      : format === 'display'
      ? 'w-full min-h-[250px]'
      : 'w-full min-h-[90px]';

  if (AD_PROVIDER === 'adsense') {
    return (
      <div className={`overflow-hidden rounded-lg ${sizeClass} ${className}`} aria-label="Publicité">
        <ins
          ref={adRef}
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={slotId}
          data-ad-format={format === 'in-feed' ? 'fluid' : 'auto'}
          data-full-width-responsive="true"
        />
      </div>
    );
  }

  return null;
}
