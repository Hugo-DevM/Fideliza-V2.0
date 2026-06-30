import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewProgramModal from './NewProgramModal';
import CreateProgramCard from './CreateProgramCard';
import Link from 'next/link';

export const metadata = { title: 'Programas — Fideliza+' };

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

type ProgramRow = {
  id: string; name: string; type: string; status: string;
  description: string | null;
  rewards: { redeemed_count: number; is_active: boolean }[];
  customer_program_enrollments: { count: number }[];
};

export default async function ProgramsPage() {
  const { tenantId, planLimits, effectivePlan } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const { data: allPrograms } = await db
    .from('reward_programs')
    .select(`
      id, name, type, status, description,
      rewards(redeemed_count, is_active),
      customer_program_enrollments(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  const programs  = (allPrograms ?? []) as unknown as ProgramRow[];
  const active    = programs.filter((p) => p.status !== 'archived');
  const archived  = programs.filter((p) => p.status === 'archived');

  const programCount   = active.length;
  const atProgramLimit = planLimits.maxPrograms !== null && programCount >= planLimits.maxPrograms;

  const limitLabel = planLimits.maxPrograms !== null ? `máx. ${planLimits.maxPrograms}` : 'ilimitados';
  const planLabel  =
    effectivePlan === 'free'       ? 'Plan Gratis'    :
    effectivePlan === 'starter'    ? 'Plan Starter'   :
    effectivePlan === 'pro'        ? 'Plan Pro'       :
    effectivePlan === 'enterprise' ? 'Plan Enterprise': 'Plan';

  function ProgramCard({ p }: { p: ProgramRow }) {
    const activeRewards   = p.rewards?.filter((r) => r.is_active) ?? [];
    const rewardCount     = activeRewards.length;
    const totalCanjes     = activeRewards.reduce((s, r) => s + (r.redeemed_count ?? 0), 0);
    const enrollmentCount = p.customer_program_enrollments?.[0]?.count ?? 0;
    const isArchived      = p.status === 'archived';
    const isPaused        = p.status === 'paused';

    return (
      <Link
        href={`/dashboard/programs/${p.id}`}
        className={`group flex flex-col rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 transition hover:shadow-md dark:hover:border-[#2a3147] ${isArchived ? 'opacity-60' : ''}`}
      >
        {/* Icon + status */}
        <div className="flex items-start justify-between mb-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${TYPE_ICON_BG[p.type] ?? 'bg-gray-100'}`}>
            <ProgramTypeIcon type={p.type} className="h-6 w-6" />
          </div>
          {p.status === 'active' ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Activo
            </span>
          ) : (
            <span className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
              isPaused ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
              isArchived ? 'bg-gray-100 dark:bg-[#1e2438] text-gray-400' :
              'bg-gray-100 dark:bg-[#1e2438] text-gray-500'
            }`}>
              {isPaused ? 'Pausado' : isArchived ? 'Archivado' : 'Borrador'}
            </span>
          )}
        </div>

        {/* Name */}
        <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{p.name}</h2>

        {/* Type pill */}
        <span className={`mt-2 inline-flex w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_STYLES[p.type] ?? ''}`}>
          {TYPE_LABELS[p.type] ?? p.type}
        </span>

        {/* Description */}
        <p className="mt-2.5 text-sm leading-snug line-clamp-2">
          {p.description
            ? <span className="text-gray-500 dark:text-gray-400">{p.description}</span>
            : <span className="italic text-gray-300 dark:text-gray-600">Sin descripción</span>
          }
        </p>

        {/* Divider */}
        <div className="mt-4 border-t border-gray-100 dark:border-[#1e2438]" />

        {/* Stats */}
        <div className="mt-3 flex gap-5">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{enrollmentCount}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">inscritos</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{rewardCount}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">recompensas</p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{totalCanjes}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">canjes</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-6">

      {/* Limit banner */}
      {atProgramLimit && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/30 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Límite de programas alcanzado ({programCount}/{planLimits.maxPrograms})
            </p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Actualiza tu plan para crear más programas.
            </p>
          </div>
          <a href="/dashboard/settings"
            className="shrink-0 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition">
            Actualizar
          </a>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-2">
            <GiftSmallIcon className="h-3.5 w-3.5" />
            Fidelización
          </p>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Programas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {programCount} activo{programCount !== 1 ? 's' : ''} · {planLabel} ({limitLabel})
          </p>
        </div>
        {!atProgramLimit && <NewProgramModal allowedTypes={planLimits.allowedProgramTypes} showHeadStart={planLimits.artificialHeadStart} />}
      </div>

      {/* Grid */}
      {!active.length ? (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-[#2a3147] p-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 mx-auto mb-3">
            <GiftSmallIcon className="h-6 w-6 text-indigo-500" />
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-200">Sin programas aún</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Crea tu primer programa de lealtad para empezar a recompensar clientes.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((p) => <ProgramCard key={p.id} p={p} />)}

          {/* Create new card */}
          {!atProgramLimit && (
            <CreateProgramCard allowedTypes={planLimits.allowedProgramTypes} showHeadStart={planLimits.artificialHeadStart} />
          )}
        </div>
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Archivados</h2>
            <span className="rounded-full bg-gray-100 dark:bg-[#1e2438] px-2 py-0.5 text-xs text-gray-400 dark:text-gray-500">{archived.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((p) => <ProgramCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────

function GiftSmallIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}

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
