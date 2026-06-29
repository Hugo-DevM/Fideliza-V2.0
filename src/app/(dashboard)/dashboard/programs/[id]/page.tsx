import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { getProgramById, listRewardsByProgram } from '@/modules/rewards';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewRewardForm from './NewRewardForm';
import ProgramStatusButtons from './ProgramStatusButtons';
import EditProgramModal from './EditProgramModal';
import DeleteRewardButton from './DeleteRewardButton';
import FlashOfferCard from './FlashOfferCard';
// TiersCard removed — tiers are now configured globally at /dashboard/tiers
import SurpriseDelightCard from './SurpriseDelightCard';
import ReferralCard from './ReferralCard';
import ChallengesCard from './ChallengesCard';
import { NotFoundError } from '@/lib/middleware/errors';
import type { ProgramStatus } from '@/lib/types';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  const { data } = await db.from('reward_programs').select('name').eq('tenant_id', tenantId).eq('id', id).single();
  return { title: `${data?.name ?? 'Programa'} — Fideliza+` };
}

const TYPE_LABELS: Record<string, string> = {
  points: 'Puntos', stamp: 'Sellos', visit: 'Visitas', cashback: 'Cashback',
};

const TYPE_STYLES: Record<string, string> = {
  points:   'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
  stamp:    'bg-violet-50 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400',
  visit:    'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  cashback: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const TYPE_ICON_BG: Record<string, string> = {
  points:   'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
  stamp:    'bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400',
  visit:    'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  cashback: 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400',
};

function conversionLabel(type: string, config: Record<string, unknown>): string {
  if (type === 'points')   return `${config.points_per_dollar ?? 1} pt / $1`;
  if (type === 'stamp')    return `${config.stamps_needed ?? 0} sellos`;
  if (type === 'visit')    return `${config.visits_needed ?? 0} visitas`;
  if (type === 'cashback') return `${config.cashback_percent ?? 0}% cashback`;
  return '—';
}

function rewardCostLabel(type: string, costPoints: number, config: Record<string, unknown>): string {
  if (type === 'stamp')    return `${config.stamps_needed ?? costPoints} sellos`;
  if (type === 'visit')    return `${config.visits_needed ?? costPoints} visitas`;
  if (type === 'cashback') return `${costPoints} pts`;
  return `${costPoints} pts`;
}

export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const activeTab = (await searchParams).tab ?? 'programa';
  const { tenantId, settings, planLimits, effectivePlan } = await getAuthenticatedTenant();

  try {
    const [program, rewards] = await Promise.all([
      getProgramById(tenantId, id),
      listRewardsByProgram(tenantId, id),
    ]);

    const db = createServiceRoleClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const challengesRes = await (db as any)
      .from('challenges')
      .select('id, title, target, bonus_points, ends_at, is_active')
      .eq('tenant_id', tenantId)
      .eq('program_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as {
        data: Array<{ id: string; title: string; target: number; bonus_points: number; ends_at: string | null; is_active: boolean }> | null;
      };

    const challenges = challengesRes.data ?? [];

    const [{ count: enrollmentCount }, { count: totalRedemptions }, { count: txTotal }, { data: recentTx }] = await Promise.all([
      db.from('customer_program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', id).eq('tenant_id', tenantId),
      db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('reward_id', rewards.map((r) => r.id)),
      db.from('transactions').select('id', { count: 'exact', head: true }).eq('program_id', id).eq('tenant_id', tenantId),
      db.from('transactions')
        .select('id, type, points_delta, note, created_at, customers(name)')
        .eq('program_id', id).eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const config = program.config as unknown as Record<string, unknown>;
    const conversion = conversionLabel(program.type, config);

    const stats = [
      { label: 'Inscritos',      value: enrollmentCount ?? 0 },
      { label: 'Recompensas',    value: rewards.length },
      { label: 'Canjes totales', value: totalRedemptions ?? 0 },
      { label: 'Conversión',     value: conversion, isText: true },
    ];

    return (
      <div className="space-y-5">

        {/* Hero card */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${TYPE_ICON_BG[program.type] ?? 'bg-gray-100'}`}>
                <ProgramTypeIcon type={program.type} className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{program.name}</h1>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[program.type] ?? ''}`}>
                    {TYPE_LABELS[program.type] ?? program.type}
                  </span>
                  {program.status === 'active' ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Activo
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-400 capitalize">
                      {program.status === 'paused' ? 'Pausado' : program.status === 'archived' ? 'Archivado' : 'Borrador'}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
                  {program.description || <span className="italic text-gray-300 dark:text-gray-600">Sin descripción</span>}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <EditProgramModal
                programId={program.id}
                currentName={program.name}
                currentDescription={program.description ?? null}
              />
              <ProgramStatusButtons
                programId={program.id}
                currentStatus={program.status as ProgramStatus}
                plan={effectivePlan}
                enrollmentCount={enrollmentCount ?? 0}
              />
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{s.label}</p>
              <p className={`font-bold text-gray-900 dark:text-white leading-none ${'isText' in s ? 'text-xl' : 'text-3xl'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1 rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-1">
          <Link
            href={`/dashboard/programs/${id}`}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium text-center transition-colors ${
              activeTab === 'programa'
                ? 'bg-gray-100 dark:bg-[#1e2438] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Programa
          </Link>
          <Link
            href={`/dashboard/programs/${id}?tab=retencion`}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium text-center transition-colors ${
              activeTab === 'retencion'
                ? 'bg-gray-100 dark:bg-[#1e2438] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Retención
          </Link>
        </div>

        {/* Retention tab */}
        {activeTab === 'retencion' && (
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <FlashOfferCard
              programId={program.id}
              plan={effectivePlan}
              programType={program.type}
              config={config}
            />
            {/* Niveles VIP moved to /dashboard/tiers */}
            <SurpriseDelightCard
              programId={program.id}
              plan={effectivePlan}
              config={config}
            />
            <ReferralCard
              programId={program.id}
              plan={effectivePlan}
              config={config}
            />
            <ChallengesCard
              programId={program.id}
              plan={effectivePlan}
              challenges={challenges}
            />
          </div>
        )}

        {/* Programa tab — content grid */}
        {activeTab === 'programa' && (
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">

          {/* Reward catalog */}
          <div className="min-h-[220px] rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Catálogo de recompensas</h2>
              {(() => {
                const activeRewards = rewards.filter((r) => r.is_active).length;
                const max = planLimits.maxRewardsPerProgram;
                const atLimit = max !== null && activeRewards >= max;
                return program.status !== 'archived' && planLimits.rewardCatalog ? (
                  !atLimit ? (
                    <NewRewardForm
                      programId={program.id}
                      programType={program.type as 'points' | 'stamp' | 'visit' | 'cashback'}
                      programConfig={config}
                      compact
                    />
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">Límite: {max} activas</span>
                  )
                ) : null;
              })()}
            </div>

            {!rewards.length && (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin recompensas aún.</p>
            )}

            {rewards.filter((r) => r.is_active).length > 0 && (
              <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                {rewards.filter((r) => r.is_active).map((r) => (
                  <li key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
                      <RewardIcon type={program.type} className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{r.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {r.redeemed_count} canjes
                        {r.stock !== null && ` · stock: ${r.stock}`}
                        {r.expiry_days && ` · vence en ${r.expiry_days}d`}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {rewardCostLabel(program.type, r.cost_points, config)}
                    </span>
                    <DeleteRewardButton programId={program.id} rewardId={r.id} rewardName={r.name} />
                  </li>
                ))}
              </ul>
            )}

            {/* Upsell when catalog not available */}
            {program.status !== 'archived' && !planLimits.rewardCatalog && (
              <div className="mx-5 mb-5 mt-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-center">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">El catálogo de recompensas requiere el plan Starter o Pro</p>
                <a href="/dashboard/settings" className="mt-1 inline-block text-xs text-amber-700 dark:text-amber-400 underline hover:text-amber-900">
                  Actualizar plan
                </a>
              </div>
            )}
          </div>

          {/* Recent transactions */}
          <div className="min-h-[220px] rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Transacciones recientes</h2>
              {(txTotal ?? 0) > 0 && (
                <span className="text-xs text-gray-400 dark:text-gray-500">{txTotal} en total</span>
              )}
            </div>
            {!recentTx?.length ? (
              <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin transacciones aún.</p>
            ) : (
              <>
                <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                  {(recentTx as unknown as Record<string, unknown>[]).map((tx) => {
                    const cust     = tx['customers'] as { name: string } | null;
                    const delta    = tx['points_delta'] as number;
                    const isPos    = delta > 0;
                    const note     = tx['note'] as string | null;
                    const name     = cust?.name ?? '—';
                    const initials = name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                    const color    = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
                    const ago      = formatAgo(new Date(tx['created_at'] as string));
                    const action   = isPos
                      ? `ganó ${delta} ${settings.program_label}`
                      : note ? `canjeó ${note}` : `canjeó ${Math.abs(delta)} pts`;
                    return (
                      <li key={tx['id'] as string} className="flex items-center gap-3 px-5 py-3.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-800 dark:text-gray-100">
                            <span className="font-semibold">{name}</span>{' '}
                            <span className="text-gray-500 dark:text-gray-400 font-normal">{action}</span>
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{ago}</p>
                        </div>
                        <span className={`shrink-0 text-sm font-semibold ${isPos ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                          {isPos ? `+${delta}` : delta} pts
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {(txTotal ?? 0) > 5 && (
                  <div className="border-t border-gray-100 dark:border-[#1e2438] px-5 py-3">
                    <Link
                      href={`/dashboard/programs/${id}/transactions`}
                      className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                    >
                      Ver todas las transacciones
                    </Link>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        )}
      </div>
    );
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }
}

const AVATAR_COLORS = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];

function formatAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

// ── Icons ─────────────────────────────────────────────────────────

function ProgramTypeIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'stamp') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
  if (type === 'visit') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
    </svg>
  );
  if (type === 'cashback') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
    </svg>
  );
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
    </svg>
  );
}

function RewardIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'points' || type === 'cashback') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
    </svg>
  );
  if (type === 'stamp') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}
