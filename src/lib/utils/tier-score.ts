/**
 * Resolves the score a customer's VIP tier should be computed from.
 *
 * Wraps the pure logic in tiers.ts with the one DB read it needs, so the portal
 * and the transaction service cannot drift apart on how a tier is decided.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { resolveTierScore, tierWindowStart, type TierWindowSettings } from '@/lib/utils/tiers';
import type { UUID } from '@/lib/types';

/**
 * Returns the effective tier score, plus the window boundary for display.
 *
 * Falls back to the lifetime score whenever the windowed sum cannot be read —
 * an unavailable aggregate must never silently demote someone.
 */
export async function getTierScore(params: {
  tenantId:      UUID;
  customerId:    UUID;
  lifetimeScore: number;
  settings:      TierWindowSettings;
  now?:          Date;
}): Promise<{ score: number; windowStart: Date | null }> {
  const { tenantId, customerId, lifetimeScore, settings } = params;
  const now = params.now ?? new Date();

  const windowStart = tierWindowStart(settings, now);
  if (!windowStart) {
    return { score: lifetimeScore, windowStart: null };
  }

  let windowed: number | null = null;
  try {
    const db = createServiceRoleClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any).rpc('rpc_tier_score', {
      p_tenant_id:   tenantId,
      p_customer_id: customerId,
      p_since:       windowStart.toISOString(),
    }) as { data: number | null; error: unknown };

    if (!error && data !== null && data !== undefined) windowed = Number(data);
  } catch { /* fall back to lifetime below */ }

  return {
    score: resolveTierScore({ windowed, lifetime: lifetimeScore, settings, now }),
    windowStart,
  };
}
