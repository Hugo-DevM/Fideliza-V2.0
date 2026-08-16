'use client';

/**
 * Writes the "remembered card" cookie once the portal has loaded successfully.
 *
 * Rendered only inside PortalShell, which means the code has already been
 * validated server-side — we never persist a code that does not resolve.
 * Renders nothing.
 */

import { useEffect } from 'react';
import { CARD_COOKIE, CARD_COOKIE_MAX_AGE, serializeCard } from '@/lib/portal/session';

export default function RememberCard({ code, subdomain }: { code: string; subdomain: string }) {
  useEffect(() => {
    const value = encodeURIComponent(serializeCard(subdomain, code));
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie =
      `${CARD_COOKIE}=${value}; path=/; max-age=${CARD_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
  }, [code, subdomain]);

  return null;
}
