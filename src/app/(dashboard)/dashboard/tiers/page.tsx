import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';
import { DEFAULT_TENANT_TIERS, TIER_STYLES } from '@/lib/utils/tiers';
import type { TenantTierSettings, TierConfig } from '@/lib/utils/tiers';
import TiersClient from './TiersClient';
import Link from 'next/link';

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

  // Tier distribution — counts per color from customers.tier_color
  type TierCount = { tier_color: string; tier_label: string; count: number };
  let distribution: TierCount[] = [];
  if (canUse && settings.tiers_enabled) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: rows } = await (db.from('customers') as any)
      .select('tier_color, tier_label')
      .eq('tenant_id', tenantId)
      .not('tier_color', 'is', null) as { data: { tier_color: string; tier_label: string }[] | null };

    const countMap = new Map<string, TierCount>();
    for (const row of (rows ?? [])) {
      const existing = countMap.get(row.tier_color);
      if (existing) {
        existing.count++;
      } else {
        countMap.set(row.tier_color, { tier_color: row.tier_color, tier_label: row.tier_label, count: 1 });
      }
    }
    // Sort by tier rank: bronze < silver < gold
    const RANK: Record<string, number> = { bronze: 1, silver: 2, gold: 3 };
    distribution = [...countMap.values()].sort((a, b) => (RANK[b.tier_color] ?? 0) - (RANK[a.tier_color] ?? 0));
  }

  const tiers = settings.tiers as TierConfig[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tiers VIP</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Define los niveles de lealtad de tus clientes. El nivel se calcula de forma universal
          a partir de todas sus interacciones, sin importar el tipo de programa.
        </p>
      </div>

      {/* ── Distribución actual ──────────────────────────────────────── */}
      {canUse && settings.tiers_enabled && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tiers.map((tier) => {
            const style  = TIER_STYLES[tier.color] ?? TIER_STYLES.bronze;
            const medal  = tier.color === 'gold' ? '🥇' : tier.color === 'silver' ? '🥈' : '🥉';
            const entry  = distribution.find((d) => d.tier_color === tier.color);
            const count  = entry?.count ?? 0;
            return (
              <Link
                key={tier.color}
                href={`/dashboard/customers?tier=${tier.color}`}
                className={`rounded-2xl border px-5 py-4 flex items-center gap-4 transition hover:opacity-80 ${style.bg} ${style.border}`}
              >
                <span className="text-2xl">{medal}</span>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold uppercase tracking-wide ${style.text}`}>{tier.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {count === 1 ? 'cliente' : 'clientes'} · {tier.multiplier}× earn
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <TiersClient settings={settings} canUse={canUse} />
    </div>
  );
}
