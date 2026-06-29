/**
 * Birthday rewards cron — GET /api/cron/birthday-rewards
 *
 * Triggered every day at 10:00 UTC via cron-job.org.
 * Secured with CRON_SECRET.
 *
 * For each customer whose birthday (birth_month + birth_day) matches today:
 *   1. Customer must be active with whatsapp_opt_in = true and a phone number
 *   2. Tenant must have wa_notify_birthday = true
 *   3. Must not have received a birthday reward this calendar year already
 *      (tracked in birthday_reward_log)
 *
 * On match:
 *   - Logs the reward in birthday_reward_log (prevents duplicates)
 *   - Enqueues a WhatsApp birthday message with 50 bonus points
 */

import { NextResponse }            from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendBirthdayMessage }     from '@/modules/whatsapp/whatsapp.service';

export const dynamic     = 'force-dynamic';
export const maxDuration = 60;

const BIRTHDAY_BONUS_POINTS = 50;
const MAX_PER_RUN = 200;

interface CustomerRow {
  id:              string;
  name:            string;
  phone:           string | null;
  tenant_id:       string;
  whatsapp_opt_in: boolean;
  is_active:       boolean;
  birth_year:      number | null;
}

interface TenantSettingsRow {
  tenant_id:          string;
  wa_notify_birthday: boolean;
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

  const now        = new Date();
  const todayMonth = now.getUTCMonth() + 1; // 1-12
  const todayDay   = now.getUTCDate();       // 1-31
  const thisYear   = now.getUTCFullYear();

  // ── Step 1: Customers with birthday today ────────────────────────────────
  const { data: customers } = await db
    .from('customers')
    .select('id, name, phone, tenant_id, whatsapp_opt_in, is_active, birth_year')
    .eq('birth_month', todayMonth)
    .eq('birth_day',   todayDay)
    .eq('is_active', true)
    .eq('whatsapp_opt_in', true)
    .not('phone', 'is', null)
    .limit(MAX_PER_RUN) as { data: CustomerRow[] | null };

  if (!customers?.length) {
    return NextResponse.json({ queued: 0, skipped: 0, eligible: 0 });
  }

  // ── Step 2: Filter out customers already rewarded this year ─────────────
  const customerIds = customers.map((c) => c.id);

  const { data: alreadySent } = await db
    .from('birthday_reward_log')
    .select('customer_id')
    .in('customer_id', customerIds)
    .eq('year', thisYear) as { data: { customer_id: string }[] | null };

  const sentSet = new Set((alreadySent ?? []).map((r) => r.customer_id));
  const eligible = customers.filter((c) => !sentSet.has(c.id));

  if (!eligible.length) {
    return NextResponse.json({ queued: 0, skipped: customers.length, eligible: 0 });
  }

  // ── Step 3: Check tenant settings ────────────────────────────────────────
  const tenantIds = [...new Set(eligible.map((c) => c.tenant_id))];

  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, wa_notify_birthday, tenants!inner(name)')
    .in('tenant_id', tenantIds)
    .eq('wa_notify_birthday', true) as { data: TenantSettingsRow[] | null };

  const enabledTenants = new Set((settingsRows ?? []).map((s) => s.tenant_id));
  const tenantNames    = new Map(
    (settingsRows ?? []).map((s) => [s.tenant_id, s.tenants?.name ?? '']),
  );

  // ── Step 4: Send and log ──────────────────────────────────────────────────
  let queued  = 0;
  let skipped = 0;

  for (const customer of eligible) {
    if (!enabledTenants.has(customer.tenant_id)) {
      skipped++;
      continue;
    }

    const businessName = tenantNames.get(customer.tenant_id) ?? '';
    const age = customer.birth_year ? thisYear - customer.birth_year : null;

    // Log first (idempotency — prevents double send if cron retries)
    const { error: logError } = await db
      .from('birthday_reward_log')
      .insert({ customer_id: customer.id, tenant_id: customer.tenant_id, year: thisYear });

    if (logError) {
      // Already logged (race condition) — skip
      skipped++;
      continue;
    }

    await sendBirthdayMessage(
      customer.id,
      customer.tenant_id,
      customer.name,
      businessName,
      customer.phone!,
      BIRTHDAY_BONUS_POINTS,
      age,
    );

    queued++;
  }

  return NextResponse.json({
    eligible: eligible.length,
    queued,
    skipped,
  });
}
