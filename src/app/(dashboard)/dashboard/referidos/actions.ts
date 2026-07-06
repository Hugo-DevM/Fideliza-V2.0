'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';

export async function updateReferralSettingsAction(data: {
  referral_enabled: boolean;
  referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
}) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();

  if (!getPlanLimits(effectivePlan).referralProgram) {
    return { error: 'El programa de referidos requiere el plan Pro.' };
  }

  // Validate bonuses
  for (const [programId, config] of Object.entries(data.referral_program_configs)) {
    if (!programId.match(/^[0-9a-f-]{36}$/i)) return { error: 'ID de programa inválido.' };
    if (config.referrer_bonus < 0 || config.referrer_bonus > 10000) return { error: 'Bono fuera de rango.' };
    if (config.referred_bonus  < 0 || config.referred_bonus  > 10000) return { error: 'Bono fuera de rango.' };
  }

  const db = createServiceRoleClient();

  const { error } = await db
    .from('tenant_settings')
    .update({
      referral_enabled:          data.referral_enabled,
      referral_program_configs:  data.referral_program_configs,
    })
    .eq('tenant_id', tenantId);

  if (error) return { error: 'No se pudo guardar la configuración.' };

  revalidatePath('/dashboard/referidos');
  return { success: true };
}

export async function getReferralStatsAction() {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();

  const [
    { count: pending },
    { count: completed },
    { data: topReferrers },
  ] = await Promise.all([
    db.from('referrals').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'pending'),
    db.from('referrals').select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId).eq('status', 'completed'),
    db.from('referrals')
      .select('referrer_id, customers!referrals_referrer_id_fkey(name)')
      .eq('tenant_id', tenantId)
      .eq('status', 'completed')
      .limit(100),
  ]);

  // Count by referrer
  const counts = new Map<string, { name: string; count: number }>();
  for (const r of topReferrers ?? []) {
    const existing = counts.get(r.referrer_id);
    const name = r.customers?.name ?? '—';
    counts.set(r.referrer_id, { name, count: (existing?.count ?? 0) + 1 });
  }
  const top5 = [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([id, v]) => ({ id, name: v.name, count: v.count }));

  return { pending: pending ?? 0, completed: completed ?? 0, top5 };
}
