/**
 * Weekly digest cron — GET /api/cron/weekly-digest
 *
 * Triggered every Monday at 8:00 AM UTC via Vercel Cron (vercel.json).
 * Secured with CRON_SECRET — Vercel sets this automatically on cron invocations.
 *
 * For each active tenant with notify_weekly_digest = true:
 *   1. Counts last 7 days of activity
 *   2. Sends a weekly digest email
 */

import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendWeeklyDigest } from '@/lib/email/resend';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createServiceRoleClient();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoIso = weekAgo.toISOString();

  // Week label: "2 – 8 jun. 2025"
  const fmt = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
  const weekLabel = `${fmt.format(weekAgo).replace(/ de /g, ' ')} – ${fmt.format(now).replace(/ de /g, ' ')}`;

  // All active tenants with digest enabled, joined with their email
  type TenantRow = { tenant_id: string; tenants: { email: string; name: string } | null };
  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, tenants!inner(email, name)')
    .eq('notify_weekly_digest', true)
    .eq('tenants.is_active', true);

  if (!settingsRows?.length) {
    return NextResponse.json({ sent: 0 });
  }

  let sent = 0;

  await Promise.all(
    (settingsRows as unknown as TenantRow[]).map(async (row) => {
      const tenantId = row.tenant_id;
      const tenant   = row.tenants;
      if (!tenant) return;

      // Parallel stats queries for the last 7 days
      const [newCustomersRes, txRes, redemptionsRes, activeRes] = await Promise.all([
        db
          .from('customers')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', weekAgoIso),
        db
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', weekAgoIso),
        db
          .from('customer_reward_redemptions')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', weekAgoIso),
        db
          .from('transactions')
          .select('customer_id')
          .eq('tenant_id', tenantId)
          .gte('created_at', weekAgoIso),
      ]);

      // Active customers = unique customer_ids in transactions this week
      const activeCustomers = new Set(
        (activeRes.data ?? []).map((t: { customer_id: string }) => t.customer_id)
      ).size;

      await sendWeeklyDigest(tenant.email, tenant.name, {
        newCustomers:    newCustomersRes.count  ?? 0,
        transactions:    txRes.count            ?? 0,
        redemptions:     redemptionsRes.count   ?? 0,
        activeCustomers,
        weekLabel,
      });

      sent++;
    })
  );

  return NextResponse.json({ sent, weekLabel });
}
