'use client';

import { useState, useTransition } from 'react';
import { updateReferralSettingsAction } from './actions';

interface Props {
  isPro: boolean;
  programs: { id: string; name: string; type: string; status: string }[];
  referralEnabled: boolean;
  referralProgramConfigs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
  stats: { pending: number; completed: number; top5: { id: string; name: string; count: number }[] };
}

function unitLabel(type: string): string {
  if (type === 'stamp')    return 'sellos';
  if (type === 'visit')    return 'visitas';
  if (type === 'cashback') return '$ bono';
  return 'pts';
}

export default function ReferidosClient({
  isPro,
  programs,
  referralEnabled: initialEnabled,
  referralProgramConfigs: initialConfigs,
  stats,
}: Props) {
  const [enabled, setEnabled]   = useState(initialEnabled);
  const [configs, setConfigs]   = useState<Record<string, { referrer_bonus: number; referred_bonus: number }>>(initialConfigs);
  const [saved,   setSaved]     = useState(false);
  const [errMsg,  setErrMsg]    = useState('');
  const [isPending, startTransition] = useTransition();

  function handleBonusChange(programId: string, field: 'referrer_bonus' | 'referred_bonus', value: string) {
    const num = Math.max(0, Math.min(10000, parseInt(value, 10) || 0));
    setConfigs((prev) => ({
      ...prev,
      [programId]: {
        referrer_bonus: prev[programId]?.referrer_bonus ?? 100,
        referred_bonus: prev[programId]?.referred_bonus ?? 50,
        [field]: num,
      },
    }));
  }

  function handleSave() {
    setErrMsg('');
    setSaved(false);
    startTransition(async () => {
      const result = await updateReferralSettingsAction({
        referral_enabled: enabled,
        referral_program_configs: configs,
      });
      if ('error' in result && result.error) {
        setErrMsg(result.error);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Programa de Referidos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Incentiva a tus clientes a recomendar tu negocio. Configura los bonos por programa.
        </p>
      </div>

      {/* Pro gate */}
      {!isPro && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-6 text-center">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            El programa de referidos requiere el plan Pro
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            Actualiza tu plan para habilitar referidos y configurar bonos por programa.
          </p>
          <a
            href="/dashboard/settings"
            className="mt-3 inline-block rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 transition"
          >
            Actualizar plan
          </a>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Pendientes" value={stats.pending} color="text-amber-600 dark:text-amber-400" />
        <StatCard label="Completados" value={stats.completed} color="text-emerald-600 dark:text-emerald-400" />
        <StatCard
          label="Top referidor"
          value={stats.top5[0]?.count ?? 0}
          sub={stats.top5[0]?.name}
          color="text-indigo-600 dark:text-indigo-400"
        />
      </div>

      {/* Enable toggle */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-white">Activar programa de referidos</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Cuando está activo, los clientes pueden ver y compartir su código de referido en el portal.
            </p>
          </div>
          <button
            type="button"
            disabled={!isPro}
            onClick={() => setEnabled((v) => !v)}
            className={[
              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              enabled ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-[#2a3147]',
              !isPro ? 'opacity-50 cursor-not-allowed' : '',
            ].join(' ')}
          >
            <span
              className={[
                'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200',
                enabled ? 'translate-x-5' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>
      </div>

      {/* Per-program config */}
      {programs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bonos por programa</h2>
          {programs.map((p) => {
            const cfg = configs[p.id] ?? { referrer_bonus: 100, referred_bonus: 50 };
            const unit = unitLabel(p.type);
            return (
              <div
                key={p.id}
                className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
                    <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800 dark:text-white">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{p.type}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Bono al referidor ({unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={cfg.referrer_bonus}
                      disabled={!isPro}
                      onChange={(e) => handleBonusChange(p.id, 'referrer_bonus', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-500/20 disabled:opacity-50"
                    />
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">Quien refirió recibe este bono</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Bono al referido ({unit})
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000}
                      value={cfg.referred_bonus}
                      disabled={!isPro}
                      onChange={(e) => handleBonusChange(p.id, 'referred_bonus', e.target.value)}
                      className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none transition focus:border-emerald-400 dark:focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-500/20 disabled:opacity-50"
                    />
                    <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">El nuevo cliente recibe este bono</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {programs.length === 0 && isPro && (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-[#2a3147] p-8 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">
            No tienes programas activos. Crea un programa para configurar bonos de referido.
          </p>
          <a href="/dashboard/programs" className="mt-2 inline-block text-sm text-indigo-500 hover:underline">
            Crear programa →
          </a>
        </div>
      )}

      {/* Top 5 referrers */}
      {stats.top5.length > 0 && (
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
            <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Top 5 referidores</h2>
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
            {stats.top5.map((r, i) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="text-lg w-6 text-center shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-800 dark:text-white truncate">{r.name}</span>
                <span className="shrink-0 rounded-full bg-emerald-50 dark:bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  {r.count} {r.count === 1 ? 'referido' : 'referidos'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Error */}
      {errMsg && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-4 py-2.5 text-sm text-red-600 dark:text-red-400">
          {errMsg}
        </p>
      )}

      {/* Save button */}
      {isPro && (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={isPending}
            onClick={handleSave}
            className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isPending ? 'Guardando…' : saved ? 'Guardado ✓' : 'Guardar configuración'}
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
      <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
      {sub && <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500 truncate">{sub}</p>}
    </div>
  );
}
