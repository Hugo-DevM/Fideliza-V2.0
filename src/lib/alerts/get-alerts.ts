/**
 * Computes in-app alerts for the dashboard bell icon.
 *
 * Four categories — deliberately separate from email notifications:
 *   1. stock_out        — active reward with stock = 0
 *   2. program_expiring — active program whose ends_at is within 7 days
 *   3. vouchers_expired — count of expired vouchers never redeemed (status = 'expired')
 *   4. milestone        — customer/transaction/redemption count hits a threshold
 *
 * All queries run in parallel. Any individual failure is silenced so the
 * shell never breaks if alerts are unavailable.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { UUID } from '@/lib/types';

export type AlertType = 'stock_out' | 'program_expiring' | 'vouchers_expired' | 'milestone';

export interface AlertItem {
  /** Stable unique key — milestones use this for localStorage dismiss tracking. */
  id: string;
  type: AlertType;
  title: string;
  body: string;
  /** Dashboard-relative URL to navigate to when clicking the alert. */
  href: string;
  /** Only milestone alerts can be dismissed (they don't self-resolve). */
  dismissible: boolean;
}

// Milestone thresholds (customers / transactions / redemptions)
const CUSTOMER_MILESTONES    = [1, 10, 50, 100, 500, 1_000] as const;
const TRANSACTION_MILESTONES = [100, 500, 1_000]            as const;
const REDEMPTION_MILESTONES  = [1, 50, 100]                 as const;

export async function getAlerts(tenantId: UUID): Promise<AlertItem[]> {
  const db = createServiceRoleClient();
  const now = new Date();
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const [stockRes, expiringRes, expiredVouchersRes, countsRes] = await Promise.allSettled([
    // 1. Active rewards with stock = 0
    db
      .from('rewards')
      .select('id, name')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .eq('stock', 0),

    // 2. Active programs expiring within 7 days
    db
      .from('reward_programs')
      .select('id, name, ends_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .not('ends_at', 'is', null)
      .lte('ends_at', in7Days)
      .gte('ends_at', now.toISOString()),

    // 3. Expired vouchers (issued but never used)
    db
      .from('customer_reward_redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'expired'),

    // 4. Counts for milestones
    Promise.all([
      db.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId).eq('is_active', true),
      db.from('transactions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
      db.from('customer_reward_redemptions').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    ]),
  ]);

  const alerts: AlertItem[] = [];

  // ── 1. Stock out ──────────────────────────────────────────────────────────
  if (stockRes.status === 'fulfilled' && stockRes.value.data) {
    for (const r of stockRes.value.data as { id: string; name: string }[]) {
      alerts.push({
        id:          `stock_out:${r.id}`,
        type:        'stock_out',
        title:       'Recompensa agotada',
        body:        `"${r.name}" no tiene stock disponible.`,
        href:        '/dashboard/programs',
        dismissible: false,
      });
    }
  }

  // ── 2. Program expiring ───────────────────────────────────────────────────
  if (expiringRes.status === 'fulfilled' && expiringRes.value.data) {
    for (const p of expiringRes.value.data as { id: string; name: string; ends_at: string }[]) {
      const daysLeft = Math.ceil(
        (new Date(p.ends_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const daysLabel = daysLeft <= 1 ? 'mañana' : `en ${daysLeft} días`;
      alerts.push({
        id:          `program_expiring:${p.id}`,
        type:        'program_expiring',
        title:       'Programa por vencer',
        body:        `"${p.name}" termina ${daysLabel}.`,
        href:        `/dashboard/programs/${p.id}`,
        dismissible: false,
      });
    }
  }

  // ── 3. Expired vouchers ───────────────────────────────────────────────────
  if (expiredVouchersRes.status === 'fulfilled') {
    const count = expiredVouchersRes.value.count ?? 0;
    if (count > 0) {
      alerts.push({
        id:          'vouchers_expired',
        type:        'vouchers_expired',
        title:       'Vouchers vencidos sin usar',
        body:        `${count} ${count === 1 ? 'voucher expiró' : 'vouchers expiraron'} sin ser canjeados.`,
        href:        '/dashboard/customers',
        dismissible: false,
      });
    }
  }

  // ── 4. Milestones ─────────────────────────────────────────────────────────
  if (countsRes.status === 'fulfilled') {
    const [customersRes, txRes, redemptionsRes] = countsRes.value;
    const customerCount   = customersRes.count    ?? 0;
    const txCount         = txRes.count           ?? 0;
    const redemptionCount = redemptionsRes.count  ?? 0;

    // Highest customer milestone reached
    for (const threshold of [...CUSTOMER_MILESTONES].reverse()) {
      if (customerCount >= threshold) {
        alerts.push({
          id:          `milestone:customers_${threshold}`,
          type:        'milestone',
          title:       threshold === 1 ? '¡Primer cliente!' : `¡${threshold.toLocaleString('es')} clientes!`,
          body:        threshold === 1
            ? 'Tu programa de lealtad está en marcha.'
            : `Alcanzaste ${threshold.toLocaleString('es')} clientes registrados. ¡Sigue así!`,
          href:        '/dashboard/customers',
          dismissible: true,
        });
        break;
      }
    }

    // Highest transaction milestone reached
    for (const threshold of [...TRANSACTION_MILESTONES].reverse()) {
      if (txCount >= threshold) {
        alerts.push({
          id:          `milestone:transactions_${threshold}`,
          type:        'milestone',
          title:       `¡${threshold.toLocaleString('es')} transacciones!`,
          body:        `Tu programa ha procesado ${threshold.toLocaleString('es')} transacciones.`,
          href:        '/dashboard',
          dismissible: true,
        });
        break;
      }
    }

    // First redemption milestone
    for (const threshold of [...REDEMPTION_MILESTONES].reverse()) {
      if (redemptionCount >= threshold) {
        alerts.push({
          id:          `milestone:redemptions_${threshold}`,
          type:        'milestone',
          title:       threshold === 1 ? '¡Primer canje!' : `¡${threshold} canjes!`,
          body:        threshold === 1
            ? 'Un cliente canjeó su primera recompensa.'
            : `${threshold} recompensas canjeadas en total.`,
          href:        '/dashboard',
          dismissible: true,
        });
        break;
      }
    }
  }

  return alerts;
}
