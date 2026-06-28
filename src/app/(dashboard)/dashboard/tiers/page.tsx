import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';
import { DEFAULT_TENANT_TIERS } from '@/lib/utils/tiers';
import type { TenantTierSettings } from '@/lib/utils/tiers';
import TiersClient from './TiersClient';

export const metadata = { title: 'Tiers VIP — Fideliza' };

export default async function TiersPage() {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  const limits  = getPlanLimits(effectivePlan);
  const canUse  = limits.universalTiers;
  const db = createServiceRoleClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw } = await (db.from('tenant_settings') as any)
    .select('tiers_enabled, tiers, tier_score_per_stamp, tier_score_per_visit, tier_score_per_point, tier_score_per_cashback_cent')
    .eq('tenant_id', tenantId)
    .maybeSingle() as { data: Record<string, unknown> | null };

  const settings: TenantTierSettings = {
    tiers_enabled:               Boolean(raw?.tiers_enabled ?? false),
    tiers:                       (raw?.tiers as typeof DEFAULT_TENANT_TIERS | undefined) ?? DEFAULT_TENANT_TIERS,
    tier_score_per_stamp:        Number(raw?.tier_score_per_stamp ?? 10),
    tier_score_per_visit:        Number(raw?.tier_score_per_visit ?? 10),
    tier_score_per_point:        Number(raw?.tier_score_per_point ?? 1),
    tier_score_per_cashback_cent: Number(raw?.tier_score_per_cashback_cent ?? 0.1),
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tiers VIP</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Define los niveles de lealtad de tus clientes. El nivel se calcula de forma universal
          a partir de todas sus interacciones, sin importar el tipo de programa.
        </p>
      </div>
      <TiersClient settings={settings} canUse={canUse} />
    </div>
  );
}
