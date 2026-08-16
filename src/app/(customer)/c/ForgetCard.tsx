'use client';

/**
 * Clears the remembered card.
 *
 * Two uses:
 *  - `auto`: the saved code no longer resolves (customer deleted, code changed).
 *    Wipes it silently so a stale cookie cannot trap the visitor on the error
 *    screen forever.
 *  - default: the "Salir" control in the portal header. Shared phones and the
 *    business's own counter tablet are the common case here — without this,
 *    the first person to open their card owns the device.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CARD_COOKIE } from '@/lib/portal/session';

function clearCard(): void {
  document.cookie = `${CARD_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function ForgetCardOnMount() {
  useEffect(() => { clearCard(); }, []);
  return null;
}

export default function ForgetCardButton() {
  const router = useRouter();

  function handleClick() {
    clearCard();
    router.push('/c');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur transition hover:bg-white/25 active:scale-95"
      aria-label="Salir y olvidar mi código en este dispositivo"
    >
      Salir
    </button>
  );
}
