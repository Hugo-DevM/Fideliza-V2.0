'use client';

import { useTransition } from 'react';

type AlertStatus = 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired';

const BANNER_CONFIG: Record<AlertStatus, { text: string; subtext: string; cta: string }> = {
  past_due: {
    text: 'Tu último pago no se procesó.',
    subtext: 'Actualiza tu método de pago para conservar las funciones de tu plan.',
    cta: 'Actualizar método de pago',
  },
  unpaid: {
    text: 'Tu suscripción tiene pagos pendientes.',
    subtext: 'Actualiza tu método de pago para evitar la suspensión de tu cuenta.',
    cta: 'Regularizar pago',
  },
  canceled: {
    text: 'Tu suscripción ha sido cancelada.',
    subtext: 'Tu acceso está limitado al plan Gratis. Reactiva tu suscripción para recuperar todas las funciones.',
    cta: 'Reactivar suscripción',
  },
  incomplete: {
    text: 'El pago inicial de tu suscripción no se completó.',
    subtext: 'Completa el pago para activar las funciones de tu plan.',
    cta: 'Completar pago',
  },
  incomplete_expired: {
    text: 'El pago inicial de tu suscripción expiró.',
    subtext: 'Inicia una nueva suscripción para acceder a las funciones de tu plan.',
    cta: 'Ver facturación',
  },
};

interface Props {
  subscriptionStatus: string | null;
  plan: string;
}

/**
 * Displays a sticky amber warning banner at the top of the dashboard
 * when the subscription is in a degraded billing state.
 *
 * States that trigger it: past_due, unpaid, canceled (non-free plan), incomplete, incomplete_expired.
 * Rendered as a client component only for the portal button interactivity.
 */
export default function SubscriptionBanner({ subscriptionStatus, plan }: Props) {
  const [isPending, startTransition] = useTransition();

  // Only show for paid plans in a degraded state
  if (plan === 'free' || !subscriptionStatus) return null;

  const status = subscriptionStatus as AlertStatus;
  const config = BANNER_CONFIG[status];
  if (!config) return null;

  function handlePortal() {
    startTransition(async () => {
      try {
        const res  = await fetch('/api/stripe/portal', { method: 'POST' });
        const json = await res.json() as { data: { url: string } | null; error: string | null };
        if (json.data?.url) {
          window.location.href = json.data.url;
        }
      } catch {
        // Silent fail — user can navigate to settings manually
      }
    });
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 mb-4"
    >
      <div className="flex items-start gap-3 min-w-0">
        {/* Warning icon */}
        <svg
          className="mt-0.5 h-4 w-4 shrink-0 text-amber-500 dark:text-amber-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {config.text}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
            {config.subtext}
          </p>
        </div>
      </div>

      <button
        onClick={handlePortal}
        disabled={isPending}
        className="shrink-0 self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-white dark:bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-500/20 disabled:opacity-50 transition"
      >
        {isPending ? 'Abriendo…' : config.cta}
        {!isPending && (
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        )}
      </button>
    </div>
  );
}
