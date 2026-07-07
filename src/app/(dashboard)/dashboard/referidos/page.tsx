import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ReferidosClient from './ReferidosClient';
import ProUpgradeOverlay from '@/components/dashboard/ProUpgradeOverlay';

export const metadata = { title: 'Referidos — Fideliza' };

export default async function ReferidosPage() {
  const { tenantId, effectivePlan, settings } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const [
    { data: programs },
    { count: pending },
    { count: completed },
    { data: topReferrersRaw },
  ] = await Promise.all([
    db.from('reward_programs').select('id, name, type, status')
      .eq('tenant_id', tenantId).eq('status', 'active'),
    db.from('referrals').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'pending'),
    db.from('referrals').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'completed'),
    db.from('referrals')
      .select('referrer_id, customers!referrals_referrer_id_fkey(name)')
      .eq('tenant_id', tenantId).eq('status', 'completed').limit(200),
  ]);

  // Aggregate top referrers
  const counts = new Map<string, { name: string; count: number }>();
  for (const r of topReferrersRaw ?? []) {
    const existing = counts.get(r.referrer_id);
    counts.set(r.referrer_id, {
      name: r.customers?.name ?? '—',
      count: (existing?.count ?? 0) + 1,
    });
  }
  const top5 = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }));

  const isPro = effectivePlan === 'pro' || effectivePlan === 'enterprise';

  const content = (
    <ReferidosClient
      programs={programs ?? []}
      referralEnabled={settings.referral_enabled ?? false}
      referralProgramConfigs={settings.referral_program_configs ?? {}}
      stats={{ pending: pending ?? 0, completed: completed ?? 0, top5 }}
    />
  );

  if (!isPro) {
    return (
      <ProUpgradeOverlay
        title="Programa de Referidos"
        description="Convierte a tus clientes en promotores: bonos automáticos para quien refiere y para el nuevo cliente. Disponible en el plan Pro."
        icon={<ReferralIcon className="h-10 w-10 text-indigo-400" />}
      >
        {content}
      </ProUpgradeOverlay>
    );
  }

  return content;
}

function ReferralIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}
