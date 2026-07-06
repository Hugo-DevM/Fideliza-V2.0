import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import ReferidosClient from './ReferidosClient';

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

  return (
    <ReferidosClient
      isPro={isPro}
      programs={programs ?? []}
      referralEnabled={settings.referral_enabled ?? false}
      referralProgramConfigs={settings.referral_program_configs ?? {}}
      stats={{ pending: pending ?? 0, completed: completed ?? 0, top5 }}
    />
  );
}
