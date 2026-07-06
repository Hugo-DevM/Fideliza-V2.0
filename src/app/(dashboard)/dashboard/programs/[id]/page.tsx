import { notFound } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { getProgramById, listRewardsByProgram } from '@/modules/rewards';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ProgramStatusButtons from './ProgramStatusButtons';
import EditProgramModal from './EditProgramModal';
import ProgramDetailTabs from './ProgramDetailTabs';
import { NotFoundError } from '@/lib/middleware/errors';
import type { ProgramStatus } from '@/lib/types';
import type { SupabaseClient } from '@supabase/supabase-js';

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


export default async function ProgramDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const initialTab = (await searchParams).tab ?? 'programa';
  const { tenantId, settings, planLimits, effectivePlan } = await getAuthenticatedTenant();

  let program: Awaited<ReturnType<typeof getProgramById>>;
  let rewards: Awaited<ReturnType<typeof listRewardsByProgram>>;
  let challenges: Array<{ id: string; title: string; description: string | null; target: number; bonus_points: number; ends_at: string | null; is_active: boolean }>;
  let enrollmentCount: number | null;
  let totalRedemptions: number | null;
  let txTotal: number | null;
  let recentTx: unknown[] | null;

  try {
    [program, rewards] = await Promise.all([
      getProgramById(tenantId, id),
      listRewardsByProgram(tenantId, id),
    ]);

    const db = createServiceRoleClient();

    const challengesRes = await (db as unknown as SupabaseClient)
      .from('challenges')
      .select('id, title, description, target, bonus_points, ends_at, is_active')
      .eq('tenant_id', tenantId)
      .eq('program_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false }) as {
        data: Array<{ id: string; title: string; description: string | null; target: number; bonus_points: number; ends_at: string | null; is_active: boolean }> | null;
      };

    challenges = challengesRes.data ?? [];

    [{ count: enrollmentCount }, { count: totalRedemptions }, { count: txTotal }, { data: recentTx }] = await Promise.all([
      db.from('customer_program_enrollments').select('id', { count: 'exact', head: true }).eq('program_id', id).eq('tenant_id', tenantId),
      db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).in('reward_id', rewards.map((r) => r.id)),
      db.from('transactions').select('id', { count: 'exact', head: true }).eq('program_id', id).eq('tenant_id', tenantId),
      db.from('transactions')
        .select('id, type, points_delta, note, created_at, customers(name)')
        .eq('program_id', id).eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);
  } catch (err) {
    if (err instanceof NotFoundError) notFound();
    throw err;
  }

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

        <ProgramDetailTabs
          initialTab={initialTab}
          programId={program.id}
          programType={program.type}
          effectivePlan={effectivePlan}
          config={config}
          challenges={challenges}
          rewards={rewards as unknown as { id: string; name: string; cost_points: number; is_active: boolean; redeemed_count: number; stock: number | null; expiry_days: number | null }[]}
          recentTx={(recentTx ?? []) as unknown as { id: string; type: string; points_delta: number; note: string | null; created_at: string; customers: { name: string } | null }[]}
          txTotal={txTotal ?? 0}
          programLabel={settings.program_label ?? 'puntos'}
          rewardCatalog={planLimits.rewardCatalog}
          maxRewardsPerProgram={planLimits.maxRewardsPerProgram}
        />
      </div>
    );
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

