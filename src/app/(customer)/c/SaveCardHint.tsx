'use client';

/**
 * Prompts the customer to put their card on the phone's home screen.
 *
 * Once added, the card is one tap away and the code never has to be typed
 * again — which is the whole point of the remembered-card cookie. This is the
 * cheap approximation of a wallet pass: an icon that opens straight to the
 * balance.
 *
 * Shown only where it can actually be acted on: real mobile browsers, not
 * already installed, not previously dismissed. There is no generic web API to
 * trigger this on iOS, so the instructions are per-platform by necessity.
 *
 * Eligibility depends on browser-only APIs (userAgent, matchMedia,
 * localStorage), which do not exist during SSR. It is therefore read through
 * useSyncExternalStore with a null server snapshot — the hook built for exactly
 * this — instead of setting state from an effect.
 */

import { useSyncExternalStore } from 'react';

const DISMISS_KEY = 'fideliza:home-screen-hint';

type Platform = 'ios' | 'android' | null;

// ── Tiny external store ───────────────────────────────────────────────
// getSnapshot must return a referentially stable value or React re-renders
// forever, hence the memo.

let listeners: Array<() => void> = [];
let snapshot: Platform | undefined;

function subscribe(cb: () => void): () => void {
  listeners.push(cb);
  return () => { listeners = listeners.filter((l) => l !== cb); };
}

function computeEligiblePlatform(): Platform {
  // Already installed to the home screen — nothing left to suggest.
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  if (iosStandalone || window.matchMedia('(display-mode: standalone)').matches) return null;

  try {
    if (localStorage.getItem(DISMISS_KEY) === '1') return null;
  } catch { /* private mode — fall through and show it */ }

  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua))          return 'android';
  return null;
}

function getSnapshot(): Platform {
  if (snapshot === undefined) snapshot = computeEligiblePlatform();
  return snapshot;
}

/** Server render: never show it — the browser decides. */
function getServerSnapshot(): Platform {
  return null;
}

function dismissHint(): void {
  try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
  snapshot = null;
  listeners.forEach((l) => l());
}

// ── Component ─────────────────────────────────────────────────────────

export default function SaveCardHint({ primaryColor }: { primaryColor: string }) {
  const platform = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (!platform) return null;

  const steps = platform === 'ios'
    ? <>Toca <strong>Compartir</strong> y luego <strong>Añadir a pantalla de inicio</strong>.</>
    : <>Toca el menú <strong>⋮</strong> y luego <strong>Agregar a pantalla principal</strong>.</>;

  return (
    <div className="mx-auto w-full max-w-lg px-4 pt-3">
      <div className="relative flex items-start gap-3 rounded-2xl bg-white dark:bg-[#161b2e] p-3.5 pr-9 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${primaryColor}1a` }}
        >
          <svg className="h-5 w-5" fill="none" stroke={primaryColor} strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Guarda tu tarjeta
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
            {steps} Así la abres al instante, sin volver a escribir tu código.
          </p>
        </div>

        <button
          type="button"
          onClick={dismissHint}
          aria-label="Ocultar este aviso"
          className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-gray-300 transition hover:bg-gray-100 hover:text-gray-500 dark:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-400"
        >
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
