/**
 * Tier revalidation cron — GET /api/cron/tier-revalidation
 *
 * Triggered daily via cron-job.org (NOT vercel.json — the free tier has no room
 * for another declared cron). Secured with CRON_SECRET.
 *
 * Deliberately a standalone route rather than a passenger on whatsapp-send:
 * that one runs every 5 minutes as the queue dispatcher, so a daily recompute
 * riding along would execute ~288 times a day and mix two unrelated jobs.
 *
 * Two things per run, for tenants that turned on a revalidation window:
 *
 *   1. Refresh the cached customers.tier_label / tier_color. With a rolling
 *      window a tier can change with NO transaction — old activity simply ages
 *      out — so nothing else in the system would ever notice.
 *
 *   2. Warn customers whose tier will drop within WARN_DAYS, while they can
 *      still do something about it.
 *
 * Only a warning is sent, never a "you lost your level" message: the point is
 * to drive a visit, and a notification that only delivers bad news reads as
 * punishment.
 */

import { NextResponse }              from 'next/server';
import { createServiceRoleClient }   from '@/lib/supabase/server';
import { sendTierAtRiskMessage }     from '@/modules/whatsapp/whatsapp.service';
import { getPlanLimits, getEffectivePlanFromTenant } from '@/lib/config/plans';
import { computeTier }               from '@/lib/utils/tiers';
import { logger }                    from '@/lib/utils/logger';
import type { TierConfig }           from '@/lib/utils/tiers';

export const dynamic     = 'force-dynamic';
export const maxDuration = 60;

/** How far ahead to look for a drop. Also the notice the customer gets. */
const WARN_DAYS = 30;

/** Safety valve — a single run must fit inside maxDuration. */
const MAX_TENANTS_PER_RUN   = 50;
const MAX_CUSTOMERS_PER_RUN = 500;

interface SettingsRow {
  tenant_id:              string;
  tiers:                  TierConfig[] | null;
  tiers_enabled:          boolean;
  tier_window_months:     number | null;
  tier_grandfather_until: string | null;
  tenants: { name: string; plan: string; subscription_status: string | null } | null;
}

interface RevalRow {
  customer_id:  string;
  name:         string;
  phone:        string;
  score_now:    number;
  score_future: number;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db  = createServiceRoleClient() as any;
  const now = new Date();

  // ── Tenants with a revalidation window configured ──────────────────────
  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, tiers, tiers_enabled, tier_window_months, tier_grandfather_until, tenants!inner(name, plan, subscription_status)')
    .eq('tiers_enabled', true)
    .not('tier_window_months', 'is', null)
    .limit(MAX_TENANTS_PER_RUN) as { data: SettingsRow[] | null };

  if (!settingsRows?.length) {
    return NextResponse.json({ tenants: 0, refreshed: 0, warned: 0 });
  }

  let refreshed = 0;
  let warned    = 0;
  let skipped   = 0;
  let processed = 0;

  for (const s of settingsRows) {
    if (processed >= MAX_CUSTOMERS_PER_RUN) break;

    const effectivePlan = getEffectivePlanFromTenant({
      plan:                s.tenants?.plan ?? 'free',
      subscription_status: s.tenants?.subscription_status ?? null,
    });
    if (!getPlanLimits(effectivePlan).universalTiers) { skipped++; continue; }

    // Nobody can drop during the grace period, so there is nothing to warn about
    // and the cached tier is still whatever the grace floor produced.
    if (s.tier_grandfather_until && now < new Date(s.tier_grandfather_until)) { skipped++; continue; }

    const tiers = s.tiers ?? [];
    if (tiers.length === 0) { skipped++; continue; }

    const months     = s.tier_window_months!;
    const sinceNow   = new Date(now); sinceNow.setUTCMonth(sinceNow.getUTCMonth() - months);
    const sinceFuture = new Date(sinceNow); sinceFuture.setUTCDate(sinceFuture.getUTCDate() + WARN_DAYS);

    const { data: rows, error } = await db.rpc('rpc_tier_revalidation', {
      p_tenant_id:    s.tenant_id,
      p_since_now:    sinceNow.toISOString(),
      p_since_future: sinceFuture.toISOString(),
    }) as { data: RevalRow[] | null; error: unknown };

    if (error || !rows?.length) continue;

    for (const row of rows) {
      if (processed >= MAX_CUSTOMERS_PER_RUN) break;
      processed++;

      const current = computeTier(Number(row.score_now), tiers);
      if (!current) continue;

      // 1. Keep the cached tier honest — it is what every dashboard list reads.
      await db
        .from('customers')
        .update({ tier_label: current.label, tier_color: current.color })
        .eq('id', row.customer_id)
        .eq('tenant_id', s.tenant_id);
      refreshed++;

      // 2. Warn only when they are actually about to drop.
      const future = computeTier(Number(row.score_future), tiers);
      const willDrop = !future || future.min_lifetime < current.min_lifetime;
      if (!willDrop || current.min_lifetime === 0) continue;

      const pointsNeeded = Math.max(1, current.min_lifetime - Number(row.score_future));

      await sendTierAtRiskMessage(
        row.customer_id,
        s.tenant_id,
        row.name,
        s.tenants?.name ?? '',
        row.phone,
        current.label,
        WARN_DAYS,
        pointsNeeded,
      );
      warned++;
    }
  }

  logger.info('[tier-revalidation] done', { tenants: settingsRows.length, refreshed, warned, skipped });

  return NextResponse.json({
    tenants: settingsRows.length,
    refreshed,
    warned,
    skipped,
    capped: processed >= MAX_CUSTOMERS_PER_RUN,
  });
}
