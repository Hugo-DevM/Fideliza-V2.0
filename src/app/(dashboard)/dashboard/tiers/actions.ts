'use server';

import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { revalidateTenantCache } from '@/lib/cache/tenant-cache';
import type { TierConfig } from '@/lib/utils/tiers';

export async function updateTenantTiersAction(payload: {
  tiers_enabled:               boolean;
  tiers:                       TierConfig[];
  tier_score_per_stamp:        number;
  tier_score_per_visit:        number;
  tier_score_per_point:        number;
  tier_score_per_cashback_cent: number;
}): Promise<{ error?: string }> {
  try {
    const { tenantId, tenant, planLimits } = await getAuthenticatedTenant();
    if (!planLimits.universalTiers) {
      return { error: 'Los niveles VIP están disponibles en el plan Pro.' };
    }
    const db = createServiceRoleClient();

    // Validate tiers: thresholds must be strictly increasing (first must be 0)
    const sorted = [...payload.tiers].sort((a, b) => a.min_lifetime - b.min_lifetime);
    if (sorted[0]?.min_lifetime !== 0) {
      return { error: 'El primer nivel debe tener umbral 0.' };
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min_lifetime <= sorted[i - 1].min_lifetime) {
        return { error: 'Los umbrales de cada nivel deben ser estrictamente crecientes.' };
      }
    }

    // Validate conversion rates are positive
    if (
      payload.tier_score_per_stamp <= 0 ||
      payload.tier_score_per_visit <= 0 ||
      payload.tier_score_per_point <= 0 ||
      payload.tier_score_per_cashback_cent <= 0
    ) {
      return { error: 'Las tasas de conversión deben ser mayores a 0.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db.from('tenant_settings') as any)
      .update({
        tiers_enabled:               payload.tiers_enabled,
        tiers:                       payload.tiers,
        tier_score_per_stamp:        payload.tier_score_per_stamp,
        tier_score_per_visit:        payload.tier_score_per_visit,
        tier_score_per_point:        payload.tier_score_per_point,
        tier_score_per_cashback_cent: payload.tier_score_per_cashback_cent,
      })
      .eq('tenant_id', tenantId);

    if (error) return { error: error.message };
    revalidateTenantCache(tenantId, tenant.subdomain);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
