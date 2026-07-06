'use client';

import Script from 'next/script';
import { useSyncExternalStore } from 'react';

const PIXEL_ID = '873790189097649';

function subscribeToConsent(onChange: () => void) {
  window.addEventListener('cookie_consent_accepted', onChange);
  return () => window.removeEventListener('cookie_consent_accepted', onChange);
}

export function MetaPixel() {
  // External store: localStorage consent flag, updated via the
  // 'cookie_consent_accepted' event dispatched by CookieBanner.
  // Server snapshot is false so nothing renders during SSR.
  const consented = useSyncExternalStore(
    subscribeToConsent,
    () => localStorage.getItem('cookie_consent') === 'accepted',
    () => false,
  );

  if (!consented) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init','${PIXEL_ID}');
        fbq('track','PageView');
      `}</Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element -- 1x1 Meta tracking pixel for no-JS fallback; must hit facebook.com directly, next/image optimization would break tracking */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
