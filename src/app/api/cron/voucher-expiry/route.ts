/**
 * Voucher expiry reminder cron — GET /api/cron/voucher-expiry
 *
 * Triggered every day at 10:00 AM UTC via Vercel Cron (vercel.json).
 * Secured with CRON_SECRET.
 *
 * For each pending voucher expiring within 3 days:
 *   1. Customer must have whatsapp_opt_in = true and a phone number
 *   2. Tenant must have wa_notify_voucher_expiry = true
 *   3. Voucher must not have been notified already (whatsapp_expiry_notified_at IS NULL)
 *
 * On match: enqueues a WhatsApp utility message and marks the voucher as notified.
 */

import { NextResponse }            from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendVoucherExpiryReminder } from '@/modules/whatsapp/whatsapp.service';

export const dynamic    = 'force-dynamic';
export const maxDuration = 60;

interface VoucherRow {
  id:          string;
  customer_id: string;
  tenant_id:   string;
  expires_at:  string;
  customers: {
    name:             string;
    phone:            string | null;
    whatsapp_opt_in:  boolean;
    is_active:        boolean;
  } | null;
  rewards: {
    name: string;
  } | null;
}

interface TenantSettingsRow {
  tenant_id:               string;
  wa_notify_voucher_expiry: boolean;
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

  const now          = new Date();
  const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // ── Step 1: Fetch pending vouchers expiring within 3 days, not yet notified ──
  const { data: vouchers, error } = await db
    .from('customer_reward_redemptions')
    .select(`
      id,
      customer_id,
      tenant_id,
      expires_at,
      customers!inner(name, phone, whatsapp_opt_in, is_active),
      rewards!inner(name)
    `)
    .eq('status', 'pending')
    .is('whatsapp_expiry_notified_at', null)
    .gte('expires_at', now.toISOString())
    .lte('expires_at', threeDaysOut.toISOString()) as {
      data: VoucherRow[] | null;
      error: unknown;
    };

  if (error || !vouchers?.length) {
    return NextResponse.json({ queued: 0, skipped: 0 });
  }

  // Filter: only opt-in customers with a phone number who are active
  const eligible = vouchers.filter(
    (v) =>
      v.customers?.whatsapp_opt_in &&
      v.customers?.phone &&
      v.customers?.is_active,
  );

  if (!eligible.length) {
    return NextResponse.json({ queued: 0, skipped: vouchers.length });
  }

  // ── Step 2: Fetch tenant settings for all unique tenant IDs in one query ──
  const tenantIds = [...new Set(eligible.map((v) => v.tenant_id))];

  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, wa_notify_voucher_expiry, tenants!inner(name)')
    .in('tenant_id', tenantIds)
    .eq('wa_notify_voucher_expiry', true) as {
      data: TenantSettingsRow[] | null;
    };

  // Build lookup maps
  const enabledTenants = new Set(
    (settingsRows ?? []).map((s) => s.tenant_id),
  );
  const tenantNames = new Map(
    (settingsRows ?? []).map((s) => [s.tenant_id, s.tenants?.name ?? '']),
  );

  // ── Step 3: Enqueue notifications and mark vouchers as notified ──
  let queued  = 0;
  let skipped = 0;

  for (const voucher of eligible) {
    if (!enabledTenants.has(voucher.tenant_id)) {
      skipped++;
      continue;
    }

    const customer     = voucher.customers!;
    const rewardName   = voucher.rewards?.name ?? 'tu recompensa';
    const businessName = tenantNames.get(voucher.tenant_id) ?? '';

    // Calculate days remaining (ceil so "today" = 1, not 0)
    const msLeft  = new Date(voucher.expires_at).getTime() - now.getTime();
    const daysLeft = Math.max(1, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

    // Enqueue the WhatsApp message (fire-and-forget, never throws)
    await sendVoucherExpiryReminder(
      voucher.customer_id,
      voucher.tenant_id,
      customer.name,
      businessName,
      customer.phone!,
      rewardName,
      daysLeft,
    );

    // Mark as notified so we don't send again tomorrow
    await db
      .from('customer_reward_redemptions')
      .update({ whatsapp_expiry_notified_at: now.toISOString() })
      .eq('id', voucher.id);

    queued++;
  }

  return NextResponse.json({
    queued,
    skipped,
    total: vouchers.length,
  });
}
