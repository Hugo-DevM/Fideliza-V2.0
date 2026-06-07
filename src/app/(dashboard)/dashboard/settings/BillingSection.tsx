'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAutoError } from '@/hooks/useAutoError';
import { useModalTransition } from '@/hooks/useModalTransition';

interface PlanUsage {
  customers: { used: number; max: number };
  programs:  { used: number; max: number };
}

interface Props {
  currentPlan:        string;
  effectivePlan:      string;
  subscriptionStatus: string | null;
  subscriptionEndDate: string | null;
  hasStripeCustomer:  boolean;
  checkoutSuccess:    boolean;
  checkoutCanceled:   boolean;
  planUsage?:         PlanUsage | null;
}

interface UpgradePreview {
  amountDue: number;
  currency:  string;
  periodEnd: number;
}

const PLAN_LABELS: Record<string, string> = {
  free:       'Gratis',
  starter:    'Starter',
  pro:        'Pro',
  enterprise: 'Enterprise',
};

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  active:             { label: 'Activa',          cls: 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' },
  trialing:           { label: 'Prueba',           cls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  past_due:           { label: 'Pago pendiente',   cls: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
  canceled:           { label: 'Cancelada',        cls: 'bg-gray-100 dark:bg-[#1e2438] text-gray-500 dark:text-gray-400' },
  incomplete:         { label: 'Incompleta',       cls: 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  incomplete_expired: { label: 'Expirada',         cls: 'bg-gray-100 dark:bg-[#1e2438] text-gray-500 dark:text-gray-400' },
  unpaid:             { label: 'Sin pagar',        cls: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400' },
};

function formatCurrency(cents: number, currency: string) {
  return new Intl.NumberFormat('es', {
    style:    'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min((used / max) * 100, 100);
  const barColor =
    pct >= 90 ? 'bg-red-500' :
    pct >= 70 ? 'bg-amber-500' :
    'bg-indigo-500';
  const textColor =
    pct >= 90 ? 'text-red-600 dark:text-red-400' :
    pct >= 70 ? 'text-amber-600 dark:text-amber-400' :
    'text-gray-500 dark:text-gray-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className={`font-semibold tabular-nums ${textColor}`}>{used} / {max}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingSection({
  currentPlan,
  effectivePlan,
  subscriptionStatus,
  subscriptionEndDate,
  hasStripeCustomer,
  checkoutSuccess,
  checkoutCanceled,
  planUsage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();

  const [upgradeModal, setUpgradeModal]     = useState(false);
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(upgradeModal);
  const [preview, setPreview]               = useState<UpgradePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const { error: previewError, setError: setPreviewError, mounted: previewMounted, displayText: previewDisplayText, wrapperStyle: previewWrapperStyle, errorStyle: previewErrorStyle } = useAutoError();
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

  const statusCfg    = subscriptionStatus ? STATUS_CONFIG[subscriptionStatus] : null;
  const isDowngraded = currentPlan !== 'free' && effectivePlan === 'free';

  return (
    <>
      {/* ── Upgrade confirmation modal ─────────────────────────────────────── */}
      {modalMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-xl space-y-4"
            style={{ opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Actualizar a Pro</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
              <div className="rounded-xl bg-indigo-50 dark:bg-indigo-500/10 px-4 py-3 space-y-1">
                <p className="text-xs text-indigo-500 dark:text-indigo-400 font-medium uppercase tracking-widest">
                  Cargo inmediato
                </p>
                <p className="text-3xl font-bold text-indigo-700 dark:text-indigo-400">
                  {formatCurrency(preview.amountDue, preview.currency)}
                </p>
                <p className="text-xs text-indigo-400 dark:text-indigo-400/70">
                  Por los días restantes del ciclo actual hasta{' '}
                  {new Date(preview.periodEnd * 1000).toLocaleDateString('es', {
                    day: 'numeric', month: 'long',
                  })}
                </p>
                <p className="text-xs text-indigo-400 dark:text-indigo-400/70">
                  A partir del próximo ciclo: $59/mes
                </p>
              </div>
            )}

            {previewMounted && (
              <div style={previewWrapperStyle}><div style={{ overflow: 'hidden' }}>
                <p style={previewErrorStyle} className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {previewDisplayText}
                </p>
              </div></div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setUpgradeModal(false)}
                disabled={confirming}
                className="flex-1 rounded-xl border border-gray-200 dark:border-[#1e2438] px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1f35] disabled:opacity-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={confirmUpgrade}
                disabled={confirming || previewLoading || !!previewError}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {confirming ? 'Procesando…' : 'Confirmar y pagar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Billing card ────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Facturación y plan</h2>
          {hasStripeCustomer && (
            <button
              onClick={handlePortal}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#1e2438] px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-200 dark:hover:border-indigo-500/40 disabled:opacity-50 transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
              </svg>
              {isPending ? 'Abriendo…' : 'Gestionar facturación'}
            </button>
          )}
        </div>

        {/* Alerts */}
        {checkoutSuccess && (
          <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-4 py-3">
            <p className="text-sm font-semibold text-green-800 dark:text-green-400">¡Pago completado!</p>
            <p className="text-xs text-green-700 dark:text-green-400/80 mt-0.5">
              Tu plan se está activando. Si no ves el cambio en unos segundos, recarga la página.
            </p>
          </div>
        )}
        {checkoutCanceled && (
          <div className="rounded-xl bg-gray-50 dark:bg-[#1a1f35] border border-gray-200 dark:border-[#1e2438] px-4 py-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Pago cancelado — no se realizó ningún cargo.</p>
          </div>
        )}
        {isDowngraded && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-4 py-3">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">Suscripción no activa</p>
            <p className="text-xs text-amber-700 dark:text-amber-400/80 mt-0.5">
              Tu plan {PLAN_LABELS[currentPlan]} no está activo. Acceso limitado al plan Gratis hasta regularizar el pago.
            </p>
          </div>
        )}
        {mounted && (
          <div style={wrapperStyle}><div style={{ overflow: 'hidden' }}>
            <p style={errorStyle} className="rounded-xl bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{displayText}</p>
          </div></div>
        )}

        {/* Current plan + status */}
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Plan actual</p>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-sm font-semibold text-indigo-700 dark:text-indigo-400 capitalize">
              {PLAN_LABELS[effectivePlan] ?? effectivePlan}
            </span>
          </div>

          {statusCfg && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Estado suscripción</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusCfg.cls}`}>
                {statusCfg.label}
              </span>
            </div>
          )}

          {subscriptionEndDate && subscriptionStatus === 'active' && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Próxima renovación</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(subscriptionEndDate).toLocaleDateString('es', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          )}

          {subscriptionEndDate && subscriptionStatus === 'canceled' && (
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Acceso hasta</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(subscriptionEndDate).toLocaleDateString('es', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </p>
            </div>
          )}
        </div>

        {/* Plan usage (free / starter only) */}
        {planUsage && (
          <div className="rounded-xl border border-gray-100 dark:border-[#1e2438] bg-gray-50 dark:bg-[#1a1f35] px-4 py-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Uso del plan</p>
            <UsageBar label="Clientes activos" used={planUsage.customers.used} max={planUsage.customers.max} />
            <UsageBar label="Programas"        used={planUsage.programs.used}  max={planUsage.programs.max}  />
          </div>
        )}

        {/* Pro: "Estás en el plan más completo" */}
        {effectivePlan === 'pro' && (
          <div className="flex items-start gap-3 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-3">
            <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-400">Estás en el plan más completo</p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400/70 mt-0.5">
                Tienes acceso a todas las funciones de Fideliza+.
              </p>
            </div>
          </div>
        )}

        {/* Free → Starter / Pro */}
        {effectivePlan === 'free' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 dark:border-[#1e2438] p-4 space-y-3">
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Starter</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  $29 <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <li>✓ Hasta 300 clientes</li>
                  <li>✓ 3 programas</li>
                  <li>✓ Catálogo de recompensas</li>
                  <li>✓ Puntos, sellos y visitas</li>
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('starter')}
                disabled={isPending}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Redirigiendo…' : 'Actualizar a Starter'}
              </button>
            </div>

            <div className="rounded-xl border-2 border-indigo-400 dark:border-indigo-500/60 p-4 space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 dark:text-white">Pro</p>
                  <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                    MÁS POTENTE
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">
                  $59 <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/mes</span>
                </p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500 dark:text-gray-400">
                  <li>✓ Clientes ilimitados</li>
                  <li>✓ Programas ilimitados</li>
                  <li>✓ Todos los tipos de programa</li>
                  <li>✓ Analíticas</li>
                  <li>✓ Exportación CSV</li>
                  <li>✓ Soporte prioritario</li>
                </ul>
              </div>
              <button
                onClick={() => handleCheckout('pro')}
                disabled={isPending}
                className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {isPending ? 'Redirigiendo…' : 'Actualizar a Pro'}
              </button>
            </div>
          </div>
        )}

        {/* Starter → Pro */}
        {effectivePlan === 'starter' && subscriptionStatus === 'active' && (
          <div className="rounded-xl border-2 border-indigo-400 dark:border-indigo-500/60 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 dark:text-white">Pro</p>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-700 dark:text-indigo-400">
                MÁS POTENTE
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              $59 <span className="text-sm font-normal text-gray-400 dark:text-gray-500">/mes</span>
            </p>
            <ul className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
              <li>✓ Clientes ilimitados</li>
              <li>✓ Programas ilimitados</li>
              <li>✓ Todos los tipos de programa</li>
              <li>✓ Exportación CSV</li>
              <li>✓ Soporte prioritario</li>
            </ul>
            <button
              onClick={() => openUpgradeModal('pro')}
              disabled={isPending}
              className="w-full rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
            >
              Actualizar a Pro
            </button>
          </div>
        )}
      </div>
    </>
  );
}
