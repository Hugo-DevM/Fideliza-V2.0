'use client';

import { useState, useTransition } from 'react';
import { updateTenantTiersAction, previewTierBackfillAction, applyTierBackfillAction } from './actions';
import { computeTier } from '@/lib/utils/tiers';
import { DEFAULT_TENANT_TIERS, TIER_STYLES } from '@/lib/utils/tiers';
import { MIN_VOUCHER_EXPIRY_DAYS } from '@/lib/config/vouchers';
import type { TierConfig, TenantTierSettings, TierWindowSettings } from '@/lib/utils/tiers';

const MULTIPLIER_OPTIONS = [
  { label: '1×',  value: 1 },
  { label: '2×',  value: 2 },
  { label: '3×',  value: 3 },
];

interface TiersClientProps {
  settings: TenantTierSettings;
  window:   TierWindowSettings;
}

/** Ordered from most generous to most demanding. */
const WINDOW_OPTIONS: { label: string; value: number | null; hint: string }[] = [
  {
    label: 'Nunca caduca',
    value: null,
    hint: 'Quien llega al nivel más alto lo conserva aunque deje de venir, con todos sus beneficios.',
  },
  {
    label: '12 meses',
    value: 12,
    hint: 'Cuenta lo acumulado en el último año. Generoso: un cliente ocasional pero constante conserva su nivel.',
  },
  {
    label: '6 meses',
    value: 6,
    hint: 'Equilibrado. Buena opción para negocios de visita regular: salones, restaurantes, tiendas.',
  },
  {
    label: '3 meses',
    value: 3,
    hint: 'Muy exigente. Solo tiene sentido donde se espera visita muy seguida: cafeterías, gimnasios.',
  },
];

export default function TiersClient({ settings, window: tierWindow }: TiersClientProps) {
  const [enabled,    setEnabled]    = useState(settings.tiers_enabled);
  const [tiers,      setTiers]      = useState<TierConfig[]>(
    settings.tiers.length > 0 ? settings.tiers : DEFAULT_TENANT_TIERS,
  );
  const [perStamp,   setPerStamp]   = useState(settings.tier_score_per_stamp);
  const [perVisit,   setPerVisit]   = useState(settings.tier_score_per_visit);
  const [perPoint,   setPerPoint]   = useState(settings.tier_score_per_point);
  const [perCashback, setPerCashback] = useState(settings.tier_score_per_cashback_cent);
  const [windowMonths, setWindowMonths] = useState<number | null>(tierWindow.tier_window_months);

  const [saved,     setSaved]     = useState(false);
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  // Retroactive tier assignment. Scores are fetched once and bucketed here, so
  // moving a threshold re-projects the distribution instantly with no round trip.
  const [backfillScores, setBackfillScores] = useState<number[] | null>(null);
  const [backfillCapped, setBackfillCapped] = useState(false);
  const [backfillDone,   setBackfillDone]   = useState<number | null>(null);
  const [backfillBusy,   setBackfillBusy]   = useState(false);

  const rates = {
    tier_score_per_stamp:        perStamp,
    tier_score_per_visit:        perVisit,
    tier_score_per_point:        perPoint,
    tier_score_per_cashback_cent: perCashback,
  };

  const projection = backfillScores
    ? tiers.map((t) => ({
        tier:  t,
        count: backfillScores.filter((s) => computeTier(s, tiers)?.label === t.label).length,
      }))
    : null;

  async function loadPreview() {
    setError('');
    setBackfillBusy(true);
    const res = await previewTierBackfillAction(rates);
    setBackfillBusy(false);
    if ('error' in res) { setError(res.error); return; }
    setBackfillScores(res.scores);
    setBackfillCapped(res.capped);
  }

  async function applyBackfill() {
    setError('');
    setBackfillBusy(true);
    const res = await applyTierBackfillAction({ tiers, rates });
    setBackfillBusy(false);
    if ('error' in res) { setError(res.error); return; }
    setBackfillDone(res.updated);
  }

  function updateTier(i: number, patch: Partial<TierConfig>) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function handleSave() {
    setError('');
    startTransition(async () => {
      const res = await updateTenantTiersAction({
        tiers_enabled:               enabled,
        tiers,
        tier_score_per_stamp:        perStamp,
        tier_score_per_visit:        perVisit,
        tier_score_per_point:        perPoint,
        tier_score_per_cashback_cent: perCashback,
        tier_window_months:          windowMonths,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* ── Master toggle ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-100 dark:bg-yellow-500/20">
              <TierIcon className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Niveles VIP</h2>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                Sistema de lealtad universal — un solo nivel por cliente, independiente del programa
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnabled((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              enabled ? 'bg-yellow-500' : 'bg-gray-200 dark:bg-[#2a3147]'
            }`}
            role="switch"
            aria-checked={enabled}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ${
                enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* ── Revalidation window ────────────────────────────────────── */}
        <div className={`px-5 py-4 border-b border-gray-100 dark:border-[#1e2438] ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
            Vigencia del nivel
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
            ¿Tus clientes conservan su nivel para siempre, o tienen que mantenerlo?
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Un nivel que no se puede perder premia lo que el cliente ya hizo. Con una ventana se
            vuelve una razón para volver: sabe que si deja de venir pierde sus premios exclusivos
            y su multiplicador.
          </p>

          <div className="flex flex-wrap gap-2">
            {WINDOW_OPTIONS.map((opt) => {
              const active = windowMonths === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setWindowMonths(opt.value)}
                  className={[
                    'rounded-xl border px-3.5 py-2 text-sm font-medium transition',
                    active
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300'
                      : 'border-gray-200 dark:border-[#2a3147] text-gray-600 dark:text-gray-300 hover:border-indigo-300',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
            {WINDOW_OPTIONS.find((o) => o.value === windowMonths)?.hint}
          </p>

          {windowMonths !== null && tierWindow.tier_window_months === null && (
            <p className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
              Al guardar se abre un <strong>periodo de gracia de {windowMonths} meses</strong> en el
              que ningún cliente baja de nivel. Es necesario porque el historial que alimenta este
              cálculo empezó a registrarse hace poco y todavía no cubre una ventana completa.
              <br />
              En la práctica: activarlo hoy no cambia nada para nadie durante {windowMonths} meses,
              y para entonces ya habrá datos reales suficientes.
            </p>
          )}

          {windowMonths !== null && tierWindow.tier_grandfather_until && (
            <p className="mt-3 rounded-xl bg-gray-50 dark:bg-[#0d0f17] px-3 py-2 text-xs text-gray-500 dark:text-gray-400">
              Periodo de gracia activo hasta el{' '}
              <strong>
                {new Date(tierWindow.tier_grandfather_until).toLocaleDateString('es-MX', {
                  day: 'numeric', month: 'long', year: 'numeric',
                })}
              </strong>
              . Hasta esa fecha ningún cliente baja de nivel.
            </p>
          )}
        </div>

        {/* ── Retroactive assignment ─────────────────────────────────── */}
        <div className={`px-5 py-4 border-b border-gray-100 dark:border-[#1e2438] ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">
            Reconocer el historial
          </h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
            Al activar los niveles, tus clientes actuales arrancan en cero — incluido el que lleva
            años viniendo. Puedes asignarles su nivel a partir de lo que ya acumularon.
          </p>

          {!projection && (
            <button
              type="button"
              onClick={loadPreview}
              disabled={backfillBusy}
              className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 transition hover:border-indigo-300 disabled:opacity-50"
            >
              {backfillBusy ? 'Calculando…' : 'Ver cómo quedarían'}
            </button>
          )}

          {projection && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {projection.map(({ tier, count }) => {
                  const s = TIER_STYLES[tier.color] ?? TIER_STYLES.bronze;
                  const medal = tier.color === 'gold' ? '🥇' : tier.color === 'silver' ? '🥈' : '🥉';
                  return (
                    <div key={tier.label} className={`rounded-xl border px-3 py-2 text-center ${s.bg} ${s.border}`}>
                      <p className="text-lg">{medal}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">{count}</p>
                      <p className={`text-[11px] font-semibold ${s.text}`}>{tier.label}</p>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500">
                Mueve los umbrales abajo y esta proyección se actualiza sola.
                {backfillCapped && ' (muestra basada en tus primeros 5,000 clientes)'}
              </p>

              {backfillDone === null ? (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={applyBackfill}
                    disabled={backfillBusy}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {backfillBusy ? 'Aplicando…' : 'Aplicar estos niveles'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setBackfillScores(null); setBackfillCapped(false); }}
                    className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 transition"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-400">
                  Listo: se asignó nivel a <strong>{backfillDone}</strong> cliente{backfillDone === 1 ? '' : 's'}.
                  Puedes volver a calcularlo cuando quieras — recalcula desde el historial, no acumula.
                </p>
              )}

              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Guarda primero los umbrales si los cambiaste: la asignación usa lo que está guardado.
              </p>
            </div>
          )}
        </div>

        <div className={`px-5 py-4 grid gap-6 lg:grid-cols-2 lg:items-start ${!enabled ? 'pointer-events-none opacity-40' : ''}`}>
          {/* ── Conversion rates ──────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Tasas de conversión a puntos de lealtad
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
              Cada acción suma puntos de lealtad al cliente, independientemente del tipo de programa.
              El nivel VIP se calcula sobre este acumulado histórico.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <ConversionInput
                label="Por sello ganado"
                suffix="pts / sello"
                value={perStamp}
                onChange={setPerStamp}
                min={1}
                integer
              />
              <ConversionInput
                label="Por visita registrada"
                suffix="pts / visita"
                value={perVisit}
                onChange={setPerVisit}
                min={1}
                integer
              />
              <ConversionInput
                label="Por punto de programa"
                suffix="pts / punto"
                value={perPoint}
                onChange={setPerPoint}
                min={0.01}
                step={0.1}
              />
              <ConversionInput
                label="Por centavo de cashback"
                suffix="pts / centavo"
                value={perCashback}
                onChange={setPerCashback}
                min={0.001}
                step={0.01}
              />
            </div>
          </div>

          {/* ── Tier levels ───────────────────────────────────────────── */}
          <div>
            <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-3">
              Niveles VIP
            </h3>
            <div className="space-y-3">
              {tiers.map((tier, i) => {
                const style = TIER_STYLES[tier.color] ?? TIER_STYLES.bronze;
                return (
                  <div
                    key={i}
                    className={`rounded-xl border px-4 py-3 space-y-3 ${style.bg} ${style.border}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">
                        {tier.color === 'bronze' ? '🥉' : tier.color === 'silver' ? '🥈' : '🥇'}
                      </span>
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updateTier(i, { label: e.target.value })}
                        maxLength={20}
                        className={`flex-1 rounded-lg border bg-white dark:bg-[#0d0f17] px-2.5 py-1.5 text-sm font-semibold outline-none transition ${style.border} ${style.text} focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-700`}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Puntos de lealtad mínimos
                        </label>
                        {i === 0 ? (
                          <div className="flex items-center rounded-lg border border-gray-200 dark:border-[#2a3147] bg-gray-100 dark:bg-[#1a1f35] px-2.5 py-1.5">
                            <span className="text-sm text-gray-400 dark:text-gray-500">0 (base)</span>
                          </div>
                        ) : (
                          <input
                            type="number"
                            min={1}
                            value={tier.min_lifetime}
                            onChange={(e) =>
                              updateTier(i, { min_lifetime: Math.max(1, parseInt(e.target.value) || 1) })
                            }
                            className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-2.5 py-1.5 text-sm outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-300 dark:focus:ring-yellow-700 text-gray-800 dark:text-gray-200"
                          />
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                          Multiplicador de ganancia
                        </label>
                        <div className="flex gap-1">
                          {MULTIPLIER_OPTIONS.filter((m) => i === 0 ? m.value === 1 : m.value > 1).map((m) => (
                            <button
                              key={m.value}
                              type="button"
                              disabled={i === 0}
                              onClick={() => updateTier(i, { multiplier: m.value })}
                              className={`flex-1 rounded-lg border py-1.5 text-xs font-semibold transition disabled:cursor-default ${
                                tier.multiplier === m.value
                                  ? style.btnSelected
                                  : 'border-gray-200 dark:border-[#2a3147] text-gray-400 dark:text-gray-500 hover:border-yellow-300 dark:hover:border-yellow-700'
                              }`}
                            >
                              {m.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Gift on reaching this tier — the moment that actually
                          drives a visit, since the voucher has to be used. */}
                      {i > 0 && (
                        <div className="sm:col-span-2">
                          <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">
                            Regalo al alcanzarlo{' '}
                            <span className="font-normal text-gray-400 dark:text-gray-500">(opcional)</span>
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={80}
                              placeholder="Ej. Postre gratis"
                              value={tier.gift_label ?? ''}
                              onChange={(e) => updateTier(i, { gift_label: e.target.value || null })}
                              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                            />
                            <input
                              type="number"
                              min={MIN_VOUCHER_EXPIRY_DAYS}
                              max={365}
                              placeholder="días"
                              title={`Días de vigencia del cupón. Mínimo ${MIN_VOUCHER_EXPIRY_DAYS}.`}
                              value={tier.gift_expiry_days ?? ''}
                              onChange={(e) =>
                                updateTier(i, { gift_expiry_days: e.target.value ? parseInt(e.target.value, 10) : null })
                              }
                              className="w-24 shrink-0 rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
                            />
                          </div>
                          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                            Se entrega como cupón la primera vez que el cliente llega a este nivel —
                            una sola vez, aunque vuelva a subir. No consume premios de tu catálogo.
                            La vigencia debe ser de al menos {MIN_VOUCHER_EXPIRY_DAYS} días para que
                            dé tiempo de avisar antes de que venza; vacío = sin vencimiento.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              El multiplicador se aplica automáticamente en cada acción, para cualquier tipo de programa.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-[#1e2438] px-5 py-3">
          {error ? (
            <p className="text-xs text-red-500">{error}</p>
          ) : saved ? (
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Guardado</p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50 transition"
          >
            {isPending ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* ── Info box ────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50 dark:bg-blue-500/10 px-5 py-4 text-sm text-blue-700 dark:text-blue-300 space-y-1">
        <p className="font-semibold">¿Cómo funcionan los puntos de lealtad?</p>
        <ul className="list-disc list-inside space-y-1 text-xs text-blue-600 dark:text-blue-400">
          <li>Cada acción (sello, visita, punto, cashback) suma puntos de lealtad según las tasas configuradas arriba.</li>
          <li>El nivel VIP se calcula sobre los puntos acumulados históricos del cliente — nunca bajan.</li>
          <li>El multiplicador del nivel aplica automáticamente en todos los programas donde el cliente gana.</li>
          <li>Cuando un cliente sube de nivel, recibe una notificación por WhatsApp (si aceptó recibirlas).</li>
        </ul>
      </div>
    </div>
  );
}

// ── Conversion rate input ───────────────────────────────────────────────────

function ConversionInput({
  label, suffix, value, onChange, min, step = 1, integer = false,
}: {
  label: string; suffix: string; value: number;
  onChange: (v: number) => void; min: number; step?: number; integer?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(e) => {
            const v = integer ? parseInt(e.target.value) || min : parseFloat(e.target.value) || min;
            onChange(Math.max(min, v));
          }}
          className="flex-1 bg-transparent text-sm font-semibold text-gray-800 dark:text-gray-100 outline-none min-w-0"
        />
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{suffix}</span>
      </div>
    </div>
  );
}

function TierIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" d="M5.166 2.621v.858c-1.035.148-2.059.33-3.071.543a.75.75 0 0 0-.584.859 6.753 6.753 0 0 0 6.138 5.6 6.73 6.73 0 0 0 2.743 1.346A6.707 6.707 0 0 1 9.279 15H8.54c-1.036 0-1.875.84-1.875 1.875V19.5h-.75a2.25 2.25 0 0 0-2.25 2.25c0 .414.336.75.75.75h15a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-2.25-2.25h-.75v-2.625c0-1.036-.84-1.875-1.875-1.875h-.739a6.706 6.706 0 0 1-1.112-3.173 6.73 6.73 0 0 0 2.743-1.347 6.753 6.753 0 0 0 6.139-5.6.75.75 0 0 0-.585-.858 47.077 47.077 0 0 0-3.07-.543V2.62a.75.75 0 0 0-.658-.744 49.798 49.798 0 0 0-6.093-.377c-2.063 0-4.096.128-6.093.377a.75.75 0 0 0-.657.744Zm0 2.629c0 1.196.312 2.32.857 3.294A5.266 5.266 0 0 1 3.16 5.337a45.6 45.6 0 0 1 2.006-.343v.256Zm13.5 0v-.256c.674.1 1.343.214 2.006.343a5.265 5.265 0 0 1-2.863 3.207 6.72 6.72 0 0 0 .857-3.294Z" clipRule="evenodd" />
    </svg>
  );
}
