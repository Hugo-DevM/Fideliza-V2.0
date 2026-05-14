import Link from 'next/link';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import NewProgramModal from './NewProgramModal';

export const metadata = { title: 'Programas — Fideliza+' };

const TYPE_BADGES: Record<string, string> = {
  points:   'bg-blue-50 text-blue-700',
  stamp:    'bg-purple-50 text-purple-700',
  visit:    'bg-green-50 text-green-700',
  cashback: 'bg-orange-50 text-orange-700',
};

const STATUS_BADGES: Record<string, string> = {
  active:   'bg-green-50 text-green-700',
  draft:    'bg-gray-100 text-gray-500',
  paused:   'bg-yellow-50 text-yellow-700',
  archived: 'bg-red-50 text-red-400',
};

const STATUS_LABELS: Record<string, string> = {
  active:   'Activo',
  draft:    'Borrador',
  paused:   'Pausado',
  archived: 'Archivado',
};

type ProgramRow = {
  id: string; name: string; type: string; status: string;
  description: string | null; created_at: string;
  rewards: { count: number }[];
  customer_program_enrollments: { count: number }[];
};

export default async function ProgramsPage() {
  const { tenantId, planLimits } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const { data: allPrograms } = await db
    .from('reward_programs')
    .select(`
      id, name, type, status, description, created_at,
      rewards(count),
      customer_program_enrollments(count)
    `)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  const programs  = (allPrograms ?? []) as unknown as ProgramRow[];
  const active    = programs.filter((p) => p.status !== 'archived');
  const archived  = programs.filter((p) => p.status === 'archived');

  const programCount  = active.length;
  const atProgramLimit = planLimits.maxPrograms !== null && programCount >= planLimits.maxPrograms;

  function ProgramCard({ p }: { p: ProgramRow }) {
    const rewardCount     = p.rewards?.[0]?.count ?? 0;
    const enrollmentCount = p.customer_program_enrollments?.[0]?.count ?? 0;
    const isArchived      = p.status === 'archived';

    return (
      <Link
        href={`/dashboard/programs/${p.id}`}
        className={`flex flex-col rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${isArchived ? 'opacity-60' : ''}`}
      >
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-gray-900">{p.name}</h2>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGES[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
            {STATUS_LABELS[p.status] ?? p.status}
          </span>
        </div>

        {p.description && (
          <p className="mt-1 text-xs text-gray-400 line-clamp-2">{p.description}</p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_BADGES[p.type] ?? ''}`}>
            {p.type}
          </span>
        </div>

        <div className="mt-3 flex gap-4 text-xs text-gray-400">
          <span>{enrollmentCount} inscritos</span>
          <span>{rewardCount} recompensa{rewardCount !== 1 ? 's' : ''}</span>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upgrade banner when at program limit */}
      {atProgramLimit && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Límite de programas alcanzado ({programCount}/{planLimits.maxPrograms})
            </p>
            <p className="mt-0.5 text-xs text-amber-700">
              Has llegado al máximo de programas de tu plan actual. Actualiza para crear más.
            </p>
          </div>
          <a
            href="/dashboard/settings"
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition"
          >
            Actualizar plan →
          </a>
        </div>
      )}

      {/* Active programs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Programas</h1>
            <p className="text-sm text-gray-500">
              {programCount} activo{programCount !== 1 ? 's' : ''}{planLimits.maxPrograms !== null ? ` · máx. ${planLimits.maxPrograms}` : ''}
            </p>
          </div>
          {!atProgramLimit && <NewProgramModal allowedTypes={planLimits.allowedProgramTypes} />}
        </div>

        {!active.length ? (
          <div className="rounded-xl border bg-white p-12 text-center shadow-sm">
            <p className="text-3xl mb-2">🎁</p>
            <p className="font-semibold text-gray-700">Sin programas aún</p>
            <p className="mt-1 text-sm text-gray-400">
              Crea tu primer programa de lealtad para empezar a recompensar clientes.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((p) => <ProgramCard key={p.id} p={p} />)}
          </div>
        )}
      </div>

      {/* Archived programs */}
      {archived.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-500">Archivados</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-400">{archived.length}</span>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {archived.map((p) => <ProgramCard key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
