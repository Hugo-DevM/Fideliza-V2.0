/**
 * WhatsApp streak-at-risk cron — GET /api/cron/whatsapp-streak-at-risk
 *
 * Triggered every Friday at 10:00 UTC via cron-job.org.
 * Secured with CRON_SECRET.
 *
 * Targets customers who have been consistently active (activity in the last
 * 14 days) but have NOT visited in the last 5 days — meaning their weekly
 * streak is at risk of breaking before the weekend.
 *
 * Streak weeks is approximated as the number of weeks between enrollment
 * created_at and last_activity_at (minimum 2).
 *
 * Safeguards:
 *   - Only targets customers with whatsapp_opt_in = true and a phone number
 *   - Frequency cap in whatsapp.service.ts limits to 2 marketing messages/month
 *   - Max 100 messages per cron run
 *   - Only runs if wa_notify_streak_at_risk = true on the tenant
 */

import { NextResponse }                from 'next/server';
import { createServiceRoleClient }    from '@/lib/supabase/server';
import { sendStreakAtRiskMessage }    from '@/modules/whatsapp/whatsapp.service';
import { getPlanLimits, getEffectivePlanFromTenant } from '@/lib/config/plans';

export const dynamic     = 'force-dynamic';
export const maxDuration = 60;

const MAX_PER_RUN       = 100;
const STREAK_WINDOW_DAYS = 14; // active within this window = has a streak
const AT_RISK_DAYS       = 5;  // hasn't visited in this many days = at risk

interface EnrollmentRow {
  customer_id:      string;
  last_activity_at: string;
  created_at:       string;
  customers: {
    name:              string;
    phone:             string | null;
    tenant_id:         string;
    whatsapp_opt_in:   boolean;
    is_active:         boolean;
  } | null;
}

interface TenantSettingsRow {
  tenant_id:                string;
  wa_notify_streak_at_risk: boolean;
  tenants: { name: string; plan: string; subscription_status: string | null } | null;
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

  const now = new Date();

  // Cutoffs
  const streakWindowCutoff = new Date(now.getTime() - STREAK_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const atRiskCutoff       = new Date(now.getTime() - AT_RISK_DAYS       * 24 * 60 * 60 * 1000);

  // ── Step 1: Find enrollments with a streak at risk ────────────────────────
  // last_activity_at is within the streak window (active recently)
  // but NOT within the at-risk cutoff (hasn't visited in 5+ days)
  const { data: enrollments } = await db
    .from('customer_program_enrollments')
    .select('customer_id, last_activity_at, created_at, customers!inner(name, phone, tenant_id, whatsapp_opt_in, is_active)')
    .gte('last_activity_at', streakWindowCutoff.toISOString())
    .lt('last_activity_at',  atRiskCutoff.toISOString())
    .limit(MAX_PER_RUN) as { data: EnrollmentRow[] | null };

  if (!enrollments?.length) {
    return NextResponse.json({ queued: 0, skipped: 0, eligible: 0 });
  }

  // Filter: only opted-in, active customers with a phone number
  const eligible = enrollments.filter((e) => {
    const c = e.customers;
    return c && c.whatsapp_opt_in && c.is_active && c.phone;
  });

  if (!eligible.length) {
    return NextResponse.json({ queued: 0, skipped: 0, eligible: 0 });
  }

  // ── Step 2: Check which tenants have streak-at-risk enabled ──────────────
  const tenantIds = [...new Set(eligible.map((e) => e.customers!.tenant_id))];

  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, wa_notify_streak_at_risk, tenants!inner(name, plan, subscription_status)')
    .in('tenant_id', tenantIds)
    .eq('wa_notify_streak_at_risk', true) as { data: TenantSettingsRow[] | null };

  // Only Pro tenants with whatsappMarketing enabled (streak-at-risk is a marketing template)
  const enabledTenants = new Set(
    (settingsRows ?? [])
      .filter((s) => {
        const effectivePlan = getEffectivePlanFromTenant({
          plan:                s.tenants?.plan ?? 'free',
          subscription_status: s.tenants?.subscription_status ?? null,
        });
        return getPlanLimits(effectivePlan).whatsappMarketing;
      })
      .map((s) => s.tenant_id),
  );
  const tenantNames    = new Map(
    (settingsRows ?? []).map((s) => [s.tenant_id, s.tenants?.name ?? '']),
  );

  // ── Step 3: Enqueue streak-at-risk messages ───────────────────────────────
  let queued  = 0;
  let skipped = 0;

  for (const enrollment of eligible) {
    const customer = enrollment.customers!;

    if (!enabledTenants.has(customer.tenant_id)) {
      skipped++;
      continue;
    }

    // Approximate streak: weeks between enrollment start and last activity
    const enrolledAt   = new Date(enrollment.created_at).getTime();
    const lastActivity = new Date(enrollment.last_activity_at).getTime();
    const streakWeeks  = Math.max(2, Math.floor((lastActivity - enrolledAt) / (7 * 24 * 60 * 60 * 1000)));

    const businessName = tenantNames.get(customer.tenant_id) ?? '';

    await sendStreakAtRiskMessage(
      enrollment.customer_id,
      customer.tenant_id,
      customer.name,
      businessName,
      customer.phone!,
      streakWeeks,
    );

    queued++;
  }

  return NextResponse.json({
    eligible: eligible.length,
    queued,
    skipped,
  });
}
