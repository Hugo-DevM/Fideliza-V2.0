'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Invisible component that calls router.refresh() every `intervalMs` ms.
 * Keeps the server-rendered portal data up to date without a full page reload.
 */
export default function AutoRefresh({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;

    function start() {
      if (id !== undefined) return;
      id = setInterval(() => router.refresh(), intervalMs);
    }

    function stop() {
      if (id === undefined) return;
      clearInterval(id);
      id = undefined;
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        // Tab became visible — refresh immediately then restart the interval
        router.refresh();
        start();
      }
    }

    if (document.visibilityState !== 'hidden') {
      start();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stop();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [intervalMs, router]);

  return null;
}
