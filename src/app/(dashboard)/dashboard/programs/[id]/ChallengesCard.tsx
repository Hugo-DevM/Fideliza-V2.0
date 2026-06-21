'use client';

import { useState, useTransition } from 'react';
import { createChallengeAction, deleteChallengeAction } from './actions';

interface Challenge {
  id: string;
  title: string;
  target: number;
  bonus_points: number;
  ends_at: string | null;
  is_active: boolean;
}

interface ChallengesCardProps {
  programId: string;
  plan: string;
  challenges: Challenge[];
}

export default function ChallengesCard({ programId, plan, challenges }: ChallengesCardProps) {
  const isPro = plan === 'pro' || plan === 'enterprise';
  const [showForm, setShowForm] = useState(false);
  const [title,  setTitle]  = useState('');
  const [target, setTarget] = useState(5);
  const [bonus,  setBonus]  = useState(100);
  const [endsAt, setEndsAt] = useState('');
  const [error,  setError]  = useState('');
  const [isPending, startTransition] = useTransition();

  const active = challenges.filter((c) => c.is_active);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('El título es obligatorio.'); return; }
    setError('');
    startTransition(async () => {
      const res = await createChallengeAction(programId, {
        title,
        target,
        bonus_points: bonus,
        ends_at:      endsAt || null,
      });
      if ('error' in res) {
        setError(res.error);
      } else {
        setTitle(''); setTarget(5); setBonus(100); setEndsAt('');
        setShowForm(false);
      }
    });
  }

  function handleDelete(challengeId: string) {
    startTransition(async () => {
      await deleteChallengeAction(programId, challengeId);
    });
  }

  return (
    <div className="rounded-2xl border border-orange-100 dark:border-orange-500/20 bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-orange-100 dark:border-orange-500/20">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 dark:bg-orange-500/20">
            <svg className="h-4 w-4 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm-8 2a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white">Misiones</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500">Retos con bonus al completarlos</p>
          </div>
        </div>
        <span className="rounded-full bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-orange-600 dark:text-orange-400">
          Pro
        </span>
      </div>

      {!isPro ? (
        <div className="px-5 py-6 text-center">
          <p className="text-sm text-gray-400 dark:text-gray-500">Las misiones requieren el plan Pro.</p>
          <a href="/dashboard/settings" className="mt-1 inline-block text-xs text-orange-600 dark:text-orange-400 underline hover:opacity-80">
            Actualizar plan
          </a>
        </div>
      ) : (
        <div className="px-5 py-4 space-y-4">

          {/* Active challenges list */}
          {active.length > 0 && (
            <ul className="space-y-2">
              {active.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-[#0d0f17] px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{c.title}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {c.target} visitas → <span className="text-orange-600 dark:text-orange-400 font-semibold">+{c.bonus_points} pts</span>
                      {c.ends_at && (
                        <> · hasta {new Date(c.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}</>
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    disabled={isPending}
                    className="shrink-0 rounded-lg p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition disabled:opacity-40"
                    title="Eliminar misión"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {active.length === 0 && !showForm && (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-2">
              Sin misiones activas. Crea una para motivar a tus clientes.
            </p>
          )}

          {/* Create form */}
          {showForm ? (
            <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-orange-100 dark:border-orange-500/20 p-4">
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Título de la misión</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Visita 5 veces en enero"
                  maxLength={80}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Visitas requeridas</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={target}
                    onChange={(e) => setTarget(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bonus (pts)</label>
                  <input
                    type="number"
                    min={1}
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value))}
                    className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fecha límite <span className="text-gray-400">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0f1222] px-3 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400/30 transition"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={isPending || !title.trim()}
                  className="flex-1 rounded-lg bg-orange-500 hover:bg-orange-600 disabled:opacity-50 px-4 py-2 text-sm font-semibold text-white transition"
                >
                  {isPending ? 'Guardando…' : 'Crear misión'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-[#1e2438] transition"
                >
                  Cancelar
                </button>
              </div>

              {/* Preview */}
              {title.trim() && (
                <p className="text-xs text-gray-400 dark:text-gray-500 text-center pt-1">
                  Visita <strong>{target} {target === 1 ? 'vez' : 'veces'}</strong> y gana <strong className="text-orange-500">+{bonus} pts</strong> de bonus
                </p>
              )}
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed border-orange-200 dark:border-orange-500/30 py-3 text-sm font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10 transition"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Nueva misión
            </button>
          )}
        </div>
      )}
    </div>
  );
}
