'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  currentPlan:        string;
  effectivePlan:      string;
  subscriptionStatus: string | null;
  subscriptionEndDate: string | null;
  hasStripeCustomer:  boolean;
  checkoutSuccess:    boolean;
  checkoutCanceled:   boolean;
}

interface UpgradePreview {
  amountDue: number;   // cents
  currency:  string;
  periodEnd: number;   // unix timestamp
}

const PLAN_LABELS: Record<string, string> = {
  free:       'Gratis',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:             { label: 'Activa',          cls: 'bg-green-50 text-green-700' },
  trialing:           { label: 'Prueba',           cls: 'bg-blue-50 text-blue-700' },
  past_due:           { label: 'Pago pendiente',   cls: 'bg-red-50 text-red-700' },
  canceled:           { label: 'Cancelada',        cls: 'bg-gray-100 text-gray-500' },
  incomplete:         { label: 'Incompleta',       cls: 'bg-yellow-50 text-yellow-700' },
  incomplete_expired: { label: 'Expirada',         cls: 'bg-gray-100 text-gray-500' },
  unpaid:             { label: 'Sin pagar',        cls: 'bg-red-50 text-red-700' },
};

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat('es', {
    style:    'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export default function BillingSection({
  currentPlan,
  effectivePlan,
  subscriptionStatus,
  subscriptionEndDate,
  hasStripeCustomer,
  checkoutSuccess,
  checkoutCanceled,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError]   = useState('');

  // Upgrade confirmation modal state
  const [upgradeModal, setUpgradeModal]     = useState(false);
  const [preview, setPreview]               = useState<UpgradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError]     = useState('');
  const [confirming, setConfirming]         = useState(false);

  async function openUpgradeModal(plan: 'starter' | 'pro') {
    setPreviewError('');
    setPreview(null);
    setUpgradeModal(true);
    setPreviewLoading(true);
    try {
      const res  = await fetch('/api/stripe/upgrade-preview', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      });
      const json = await res.json() as { data: UpgradePreview | null; error: string | null };
      if (!res.ok || json.error || !json.data) {
        setPreviewError(json.error ?? 'No se pudo calcular el monto.');
      } else {
        setPreview(json.data);
      }
    } catch {
      setPreviewError('Error de red al calcular el monto.');
    } finally {
      setPreviewLoading(false);
    }
  }

  async function confirmUpgrade() {
    setConfirming(true);
    setPreviewError('');
    try {
      const res  = await fetch('/api/stripe/upgrade', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan: 'pro' }),
      });
      const json = await res.json() as { data: { plan: string } | null; error: string | null };
      if (!res.ok || json.error) {
        setPreviewError(json.error ?? 'Error al cambiar de plan.');
        setConfirming(false);
        return;
      }
      setUpgradeModal(false);
      router.refresh();
    } catch {
      setPreviewError('Error de red. Inténtalo de nuevo.');
      setConfirming(false);
    }
  }

  async function handleCheckout(plan: 'starter' | 'pro') {
    setError('');
    startTransition(async () => {
      try {
        const res  = await fetch('/api/stripe/checkout', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ plan }),
        });
        const json = await res.json() as { data: { url: string } | null; error: string | null };
        if (!res.ok || json.error) { setError(json.error ?? 'Error al iniciar pago'); return; }
        if (json.data?.url) window.location.href = json.data.url;
      } catch {
        setError('Error de red. Inténtalo de nuevo.');
      }
    });
  }

  async function handlePortal() {
    setError('');
    startTransition(async () => {
      try {
        const res  = await fetch('/api/stripe/portal', { method: 'POST' });
        const json = await res.json() as { data: { url: string } | null; error: string | null };
        if (!res.ok || json.error) { setError(json.error ?? 'Error al abrir el portal'); return; }
        if (json.data?.url) window.location.href = json.data.url;
      } catch {
        setError('Error de red. Inténtalo de nuevo.');
      }
    });
  }

  const statusCfg   = subscriptionStatus ? STATUS_CONFIG[subscriptionStatus] : null;
  const isDowngraded = currentPlan !== 'free' && effectivePlan === 'free';

  return (
    <>
      {/* ── Upgrade confirmation modal ─────────────────────────────────────── */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Actualizar a Pro</h3>
              <p className="mt-1 text-sm text-gray-500">
                Se cobrará inmediatamente la diferencia prorrateada a tu método de pago registrado.
              </p>
            </div>

            {previewLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Calculando monto…
              </div>
            )}

            {preview && !previewLoading && (
              <div className="rounded-xl bg-indigo-50 px-4 py-3 space-y-1">
                <p className="text-xs text-indigo-500 font-medium uppercase tracking-widest">Cargo inmediato</p>
                <p className="text-3xl font-bold text-indigo-700">
                  {formatCurrency(preview.amountDue, preview.currency)}
                </p>
                <p className="text-xs text-indigo-400">
                  Por los días restantes del ciclo actual hasta{' '}
                  {new Date(preview.periodEnd * 1000).toLocaleDateString('es', {
                    day: 'numeric', month: 'long',
                  })}
                </p>
                <p className="text-xs text-indigo-400">
                  A partir del próximo ciclo: $59/mes
                </p>
              </div>
            )}

            {previewError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{previewError}</p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUpgradeModal(false)}
                disabled={confirming}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={confirming || previewLoading || !!previewError}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {confirming ? 'Procesando…' : 'Confirmar y pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main billing card ──────────────────────────────────────────────── */}
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Facturación y plan</h2>

        {checkoutSuccess && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3">
            <p className="text-sm font-semibold text-green-800">¡Pago completado!</p>
            <p className="text-xs text-green-700 mt-0.5">
              Tu plan se está activando. Si no ves el cambio en unos segundos, recarga la página.
            </p>
          </div>
        )}
        {checkoutCanceled && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
            <p className="text-sm text-gray-600">Pago cancelado — no se realizó ningún cargo.</p>
          </div>
        )}

        {isDowngraded && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800">Suscripción no activa</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Tu plan {PLAN_LABELS[currentPlan]} no está activo. Acceso limitado al plan Gratis hasta regularizar el pago.
            </p>
          </div>
        )}

        {/* Current plan + status */}
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1">Plan actual</p>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-700 capitalize">
              {PLAN_LABELS[effectivePlan] ?? effectivePlan}
            </span>
          </div>

          {statusCfg && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Estado suscripción</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
          )}

          {subscriptionEndDate && subscriptionStatus === 'active' && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Próxima renovación</p>
              <p className="text-sm text-gray-700">
                {new Date(subscriptionEndDate).toLocaleDateString('es', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          )}

          {subscriptionEndDate && subscriptionStatus === 'canceled' && (
            <div>
              <p className="text-xs text-gray-400 mb-1">Acceso hasta</p>
              <p className="text-sm text-gray-700">
                {new Date(subscriptionEndDate).toLocaleDateString('es', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {/* Free → Starter / Pro */}
        {effectivePlan === 'free' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900">Starter</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  $29 <span className="text-sm font-normal text-gray-400">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li>✓ Hasta 500 clientes</li>
                  <li>✓ 3 programas</li>
                  <li>✓ Catálogo de recompensas</li>
                  <li>✓ Puntos, sellos y visitas</li>
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('starter')}
                disabled={isPending}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Redirigiendo…' : 'Actualizar a Starter'}
              </button>
            </div>

            <div className="rounded-xl border-2 border-indigo-400 p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">Pro</p>
                  <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    MÁS POTENTE
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  $59 <span className="text-sm font-normal text-gray-400">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li>✓ Clientes ilimitados</li>
                  <li>✓ Programas ilimitados</li>
                  <li>✓ Todos los tipos de programa</li>
                  <li>✓ Exportación CSV</li>
                  <li>✓ Soporte prioritario</li>
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={isPending}
                className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Redirigiendo…' : 'Actualizar a Pro'}
              </button>
            </div>
          </div>
        )}

        {/* Starter → Pro */}
        {effectivePlan === 'starter' && subscriptionStatus === 'active' && (
          <div className="rounded-xl border-2 border-indigo-400 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">Pro</p>
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                MÁS POTENTE
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              $59 <span className="text-sm font-normal text-gray-400">/mes</span>
            </p>
            <ul className="space-y-1 text-xs text-gray-500">
              <li>✓ Clientes ilimitados</li>
              <li>✓ Programas ilimitados</li>
              <li>✓ Todos los tipos de programa</li>
              <li>✓ Exportación CSV</li>
              <li>✓ Soporte prioritario</li>
            </ul>
            <button
              onClick={() => openUpgradeModal('pro')}
              disabled={isPending}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              Actualizar a Pro
            </button>
          </div>
        )}

        {/* Manage subscription */}
        {hasStripeCustomer && (
          <div className="flex items-center justify-between pt-1 border-t">
            <p className="text-sm text-gray-500">Cambiar plan, cancelar o actualizar método de pago</p>
            <button
              onClick={handlePortal}
              disabled={isPending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
            >
              {isPending ? 'Abriendo…' : 'Gestionar suscripción →'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
