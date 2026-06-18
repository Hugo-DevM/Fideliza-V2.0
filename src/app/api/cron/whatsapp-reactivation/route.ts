/**
 * WhatsApp reactivation cron — GET /api/cron/whatsapp-reactivation
 *
 * Triggered every Monday at 9:00 AM UTC via Vercel Cron (vercel.json).
 * Secured with CRON_SECRET.
 *
 * Targets customers who have NOT had activity in any program for 21+ days.
 * Sends a marketing reactivation message with a bonus points incentive.
 *
 * Safeguards:
 *   - Only targets customers registered > 21 days ago (new customers excluded)
 *   - Frequency cap in whatsapp.service.ts limits to 2 marketing messages/month
 *   - Max 100 messages per cron run (prevents Vercel timeout + Meta rate limits)
 *   - Only runs if wa_notify_reactivation = true on the tenant
 */

import { NextResponse }              from 'next/server';
import { createServiceRoleClient }   from '@/lib/supabase/server';
import { sendReactivationMessage }   from '@/modules/whatsapp/whatsapp.service';

export const dynamic     = 'force-dynamic';
export const maxDuration = 60;

const INACTIVITY_DAYS  = 21;
const MAX_PER_RUN      = 100;
// Default bonus points advertised in the reactivation message.
// Future: make this configurable per tenant in tenant_settings.
const DEFAULT_BONUS_PTS = 50;

interface CustomerRow {
  id:         string;
  name:       string;
  phone:      string;
  tenant_id:  string;
  created_at: string;
}

interface TenantSettingsRow {
  tenant_id:              string;
  wa_notify_reactivation: boolean;
  tenants: { name: string } | null;
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  const now     = new Date();
  const cutoff  = new Date(now.getTime() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000);
  const cutoffIso = cutoff.toISOString();

  // ── Step 1: Find customer IDs that had recent activity ────────────────────
  // A customer is "active" if any of their program enrollments had activity
  // within the last 21 days. We collect active IDs to exclude them.
  const { data: recentRows } = await db
    .from('customer_program_enrollments')
    .select('customer_id')
    .gte('last_activity_at', cutoffIso) as {
      data: { customer_id: string }[] | null;
    };

  const recentIds = new Set((recentRows ?? []).map((r) => r.customer_id));

  // ── Step 2: Get all opt-in active customers registered > 21 days ago ──────
  // Excluding recently-created customers prevents messaging people who just
  // signed up but haven't had time to accumulate activity yet.
  const { data: allCustomers } = await db
    .from('customers')
    .select('id, name, phone, tenant_id, created_at')
    .eq('whatsapp_opt_in', true)
    .eq('is_active', true)
    .not('phone', 'is', null)
    .lt('created_at', cutoffIso) as {
      data: CustomerRow[] | null;
    };

  if (!allCustomers?.length) {
    return NextResponse.json({ queued: 0, skipped: 0, inactive: 0 });
  }

  // Customers with no activity in the last 21 days
  const inactive = allCustomers
    .filter((c) => !recentIds.has(c.id))
    .slice(0, MAX_PER_RUN);

  if (!inactive.length) {
    return NextResponse.json({ queued: 0, skipped: 0, inactive: 0 });
  }

  // ── Step 3: Check which tenants have reactivation enabled ────────────────
  const tenantIds = [...new Set(inactive.map((c) => c.tenant_id))];

  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, wa_notify_reactivation, tenants!inner(name)')
    .in('tenant_id', tenantIds)
    .eq('wa_notify_reactivation', true) as {
      data: TenantSettingsRow[] | null;
    };

  const enabledTenants = new Set((settingsRows ?? []).map((s) => s.tenant_id));
  const tenantNames    = new Map(
    (settingsRows ?? []).map((s) => [s.tenant_id, s.tenants?.name ?? '']),
  );

  // ── Step 4: Enqueue reactivation messages ────────────────────────────────
  let queued  = 0;
  let skipped = 0;

  for (const customer of inactive) {
    if (!enabledTenants.has(customer.tenant_id)) {
      skipped++;
      continue;
    }

    const businessName = tenantNames.get(customer.tenant_id) ?? '';

    // Fire-and-forget — frequency cap in whatsapp.service.ts prevents
    // sending more than 2 marketing messages per month per customer
    await sendReactivationMessage(
      customer.id,
      customer.tenant_id,
      customer.name,
      businessName,
      customer.phone,
      DEFAULT_BONUS_PTS,
    );

    queued++;
  }

  return NextResponse.json({
    inactive: inactive.length,
    queued,
    skipped,
  });
}
