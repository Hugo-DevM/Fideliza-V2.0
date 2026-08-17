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
  /** null = el nivel nunca caduca. 6 / 12 = ventana móvil de revalidación. */
  tier_window_months:          number | null;
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

    // Tier gifts are free text, so the only thing to guard is that a configured
    // gift is actually usable: an empty label grants nothing, and an out-of-range
    // expiry would produce a voucher that dies the same day or never.
    for (const t of payload.tiers) {
      const label = t.gift_label?.trim();
      if (label && label.length > 80) {
        return { error: 'El regalo de nivel no puede pasar de 80 caracteres.' };
      }
      if (t.gift_expiry_days != null && (t.gift_expiry_days < 1 || t.gift_expiry_days > 365)) {
        return { error: 'La vigencia del regalo debe estar entre 1 y 365 días.' };
      }
      if (!label && t.gift_expiry_days != null) {
        return { error: 'Escribe qué se regala antes de poner una vigencia.' };
      }
    }

    const windowMonths = payload.tier_window_months;
    if (windowMonths !== null && (windowMonths < 1 || windowMonths > 60)) {
      return { error: 'La ventana de revalidación debe estar entre 1 y 60 meses.' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: current } = await (db.from('tenant_settings') as any)
      .select('tier_window_months, tier_grandfather_until')
      .eq('tenant_id', tenantId)
      .maybeSingle() as { data: { tier_window_months: number | null; tier_grandfather_until: string | null } | null };

    // Turning the window on for the first time starts a grace period equal to
    // the window itself. That is not an arbitrary courtesy: loyalty_delta only
    // began being recorded when the monthly ranking shipped, so a 12-month
    // window has no 12 months of data behind it yet and every existing customer
    // would drop to the bottom tier overnight. By the time the grace expires,
    // a full window of real data exists.
    let grandfatherUntil = current?.tier_grandfather_until ?? null;
    const turningOn = windowMonths !== null && (current?.tier_window_months ?? null) === null;
    if (turningOn) {
      const until = new Date();
      until.setUTCMonth(until.getUTCMonth() + windowMonths);
      grandfatherUntil = until.toISOString();
    }
    if (windowMonths === null) grandfatherUntil = null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (db.from('tenant_settings') as any)
      .update({
        tiers_enabled:               payload.tiers_enabled,
        tiers:                       payload.tiers,
        tier_score_per_stamp:        payload.tier_score_per_stamp,
        tier_score_per_visit:        payload.tier_score_per_visit,
        tier_score_per_point:        payload.tier_score_per_point,
        tier_score_per_cashback_cent: payload.tier_score_per_cashback_cent,
        tier_window_months:          windowMonths,
        tier_grandfather_until:      grandfatherUntil,
      })
      .eq('tenant_id', tenantId);

    if (error) return { error: error.message };
    revalidateTenantCache(tenantId, tenant.subdomain);
    return {};
  } catch (e) {
    return { error: (e as Error).message };
  }
}
