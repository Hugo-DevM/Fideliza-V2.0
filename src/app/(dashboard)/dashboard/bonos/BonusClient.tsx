'use client';

import { useRef, useState, useTransition } from 'react';
import { updateBonusConfigAction } from './actions';

interface BonusCfg {
  birthday_bonus_units:             number;
  birthday_bonus_expiry_days:       number;
  reactivation_bonus_units:         number;
  reactivation_bonus_expiry_days:   number;
}

interface PendingRow {
  id:          string;
  customer_id: string;
  bonus_type:  'birthday' | 'reactivation';
  units:       number;
  expires_at:  string;
  created_at:  string;
  customers: { name: string; access_code: string } | null;
}

export default function BonusClient({
  cfg,
  pendingRows,
}: {
  cfg: BonusCfg;
  pendingRows: PendingRow[];
}) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setMsg(null);
    startTransition(async () => {
      const res = await updateBonusConfigAction(fd);
      if (res.error) setMsg({ ok: false, text: res.error });
      else            setMsg({ ok: true,  text: 'Configuración guardada.' });
    });
  }

  const BONUS_LABELS: Record<string, string> = {
    birthday:     '🎂 Cumpleaños',
    reactivation: '🔔 Reactivación',
  };

  return (
    <div className="space-y-6">
      {/* ── Config form ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] p-6 space-y-5">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Configuración de bonos</h2>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {/* Birthday */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">🎂 Bono de cumpleaños</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Puntos a regalar</span>
                <input
                  type="number"
                  name="birthday_bonus_units"
                  min={1} max={10000}
                  defaultValue={cfg.birthday_bonus_units}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Vigencia (días)</span>
                <input
                  type="number"
                  name="birthday_bonus_expiry_days"
                  min={1} max={365}
                  defaultValue={cfg.birthday_bonus_expiry_days}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </label>
            </div>
          </div>

          {/* Reactivation */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">🔔 Bono de reactivación</p>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Puntos a regalar</span>
                <input
                  type="number"
                  name="reactivation_bonus_units"
                  min={1} max={10000}
                  defaultValue={cfg.reactivation_bonus_units}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </label>
              <label className="block">
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Vigencia (días)</span>
                <input
                  type="number"
                  name="reactivation_bonus_expiry_days"
                  min={1} max={365}
                  defaultValue={cfg.reactivation_bonus_expiry_days}
                  className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
              </label>
            </div>
          </div>

          {msg && (
            <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {msg.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </section>

      {/* ── Pending bonuses table ─────────────────────────────────────── */}
      <section className="rounded-2xl border border-gray-200 dark:border-[#1e2538] bg-white dark:bg-[#0f1222] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2538] flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Bonos pendientes</h2>
          <span className="text-xs text-gray-400">{pendingRows.length} cliente{pendingRows.length !== 1 ? 's' : ''}</span>
        </div>

        {pendingRows.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            No hay bonos pendientes por reclamar.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-[#1e2538]">
            {pendingRows.map((row) => {
              const expiresAt  = new Date(row.expires_at);
              const daysLeft   = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const isExpiring = daysLeft <= 3;
              return (
                <div key={row.id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {row.customers?.name ?? 'Cliente'}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {BONUS_LABELS[row.bonus_type] ?? row.bonus_type} ·{' '}
                      {new Date(row.created_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">+{row.units} pts</p>
                    <p className={`text-xs ${isExpiring ? 'text-red-500 dark:text-red-400 font-semibold' : 'text-gray-400 dark:text-gray-500'}`}>
                      {daysLeft > 0 ? `Vence en ${daysLeft}d` : 'Vence hoy'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
