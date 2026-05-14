'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Invisible component that calls router.refresh() every `intervalMs` ms.
 * Keeps the server-rendered portal data up to date without a full page reload.
 */
export default function AutoRefresh({ intervalMs = 20_000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, router]);

  return null;
}
