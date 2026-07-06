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
 *   - Enqueues a WhatsApp birthday message with the bonus and the
 *     unit label of the program the customer is closest to completing
 */

import { NextResponse }                from 'next/server';
import { createServiceRoleClient }    from '@/lib/supabase/server';
import { sendBirthdayMessage }        from '@/modules/whatsapp/whatsapp.service';
import { getPlanLimits, getEffectivePlanFromTenant } from '@/lib/config/plans';

export const dynamic     = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_BIRTHDAY_BONUS = 50;
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
  tenant_id:                  string;
  wa_notify_birthday:         boolean;
  birthday_bonus_points:      number;
  birthday_bonus_expiry_days: number;
  tenants: { name: string; plan: string; subscription_status: string | null } | null;
}

interface EnrollmentRow {
  customer_id:  string;
  current_points: number;
  stamp_count:  number;
  visit_count:  number;
  program_id:   string;
  reward_programs: {
    type:   string;
    config: Record<string, unknown>;
  } | null;
}

/** Maps program type to a human-readable Spanish unit label. */
function unitLabelFromType(type: string): string {
  switch (type) {
    case 'stamp':    return 'Sellos';
    case 'visit':    return 'Visitas';
    case 'cashback': return 'Cashback';
    default:         return 'Puntos';
  }
}

/**
 * For a set of enrollments belonging to one customer, pick the one that is
 * closest to 100% completion (highest progress ratio) and return its unit label.
 * Falls back to 'Puntos' when there are no active enrollments.
 */
function pickClosestUnitLabel(
  enrollments: EnrollmentRow[],
  minCostByProgram: Map<string, number>,
): string {
  if (enrollments.length === 0) return 'Puntos';
  if (enrollments.length === 1) {
    return unitLabelFromType(enrollments[0].reward_programs?.type ?? 'points');
  }

  let bestRatio = -1;
  let bestType  = 'points';

  for (const e of enrollments) {
    const type   = e.reward_programs?.type ?? 'points';
    const config = e.reward_programs?.config ?? {};
    let goal     = 0;
    let current  = 0;

    if (type === 'stamp') {
      goal    = typeof config.stamps_needed === 'number' ? config.stamps_needed : 0;
      current = e.stamp_count;
    } else if (type === 'visit') {
      goal    = typeof config.visits_needed === 'number' ? config.visits_needed : 0;
      current = e.visit_count;
    } else {
      // points / cashback: use cheapest available reward as goal
      goal    = minCostByProgram.get(e.program_id) ?? 0;
      current = e.current_points;
    }

    const ratio = goal > 0 ? current / goal : 0;
    if (ratio > bestRatio) {
      bestRatio = ratio;
      bestType  = type;
    }
  }

  return unitLabelFromType(bestType);
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
  const eligibleIds = eligible.map((c) => c.id);
  const tenantIds   = [...new Set(eligible.map((c) => c.tenant_id))];

  const { data: settingsRows } = await db
    .from('tenant_settings')
    .select('tenant_id, wa_notify_birthday, birthday_bonus_points, birthday_bonus_expiry_days, tenants!inner(name, plan, subscription_status)')
    .in('tenant_id', tenantIds)
    .eq('wa_notify_birthday', true) as { data: TenantSettingsRow[] | null };

  // Only Pro tenants with birthdayRewards flag active
  const enabledTenants = new Set(
    (settingsRows ?? [])
      .filter((s) => {
        const effectivePlan = getEffectivePlanFromTenant({
          plan:                s.tenants?.plan ?? 'free',
          subscription_status: s.tenants?.subscription_status ?? null,
        });
        return getPlanLimits(effectivePlan).birthdayRewards;
      })
      .map((s) => s.tenant_id),
  );
  const tenantNames    = new Map(
    (settingsRows ?? []).map((s) => [s.tenant_id, s.tenants?.name ?? '']),
  );
  const tenantBonusConfig = new Map(
    (settingsRows ?? []).map((s) => [s.tenant_id, {
      units:       s.birthday_bonus_points      ?? DEFAULT_BIRTHDAY_BONUS,
      expiry_days: s.birthday_bonus_expiry_days ?? 30,
    }]),
  );

  // ── Step 4: Batch-fetch enrollments for all eligible customers ───────────
  // Used to determine which program each customer is closest to completing
  // so we can personalise the unit label in the birthday WhatsApp message.
  const { data: enrollmentRows } = await db
    .from('customer_program_enrollments')
    .select('customer_id, current_points, stamp_count, visit_count, program_id, reward_programs!inner(type, config)')
    .in('customer_id', eligibleIds)
    .eq('reward_programs.status', 'active') as { data: EnrollmentRow[] | null };

  // Group enrollments by customer
  const enrollmentsByCustomer = new Map<string, EnrollmentRow[]>();
  for (const row of enrollmentRows ?? []) {
    const arr = enrollmentsByCustomer.get(row.customer_id) ?? [];
    arr.push(row);
    enrollmentsByCustomer.set(row.customer_id, arr);
  }

  // Collect program IDs that are points/cashback (need cheapest reward to calc %)
  const pointsProgramIds = [
    ...new Set(
      (enrollmentRows ?? [])
        .filter((e) => {
          const t = e.reward_programs?.type;
          return t === 'points' || t === 'cashback';
        })
        .map((e) => e.program_id),
    ),
  ];

  // Batch-fetch cheapest reward cost per points/cashback program
  const minCostByProgram = new Map<string, number>();
  if (pointsProgramIds.length > 0) {
    const { data: costRows } = await db
      .from('rewards')
      .select('program_id, cost_points')
      .in('program_id', pointsProgramIds)
      .eq('is_active', true) as { data: { program_id: string; cost_points: number }[] | null };

    for (const row of costRows ?? []) {
      const existing = minCostByProgram.get(row.program_id);
      if (existing === undefined || row.cost_points < existing) {
        minCostByProgram.set(row.program_id, row.cost_points);
      }
    }
  }

  // ── Step 5: Send and log ──────────────────────────────────────────────────
  let queued  = 0;
  let skipped = 0;

  for (const customer of eligible) {
    if (!enabledTenants.has(customer.tenant_id)) {
      skipped++;
      continue;
    }

    const businessName = tenantNames.get(customer.tenant_id) ?? '';
    const bonusCfg = tenantBonusConfig.get(customer.tenant_id) ?? { units: DEFAULT_BIRTHDAY_BONUS, expiry_days: 30 };
    const age = customer.birth_year ? thisYear - customer.birth_year : null;

    // Determine unit label from the program the customer is closest to completing
    const customerEnrollments = enrollmentsByCustomer.get(customer.id) ?? [];
    const unitLabel = pickClosestUnitLabel(customerEnrollments, minCostByProgram);

    // Log first (idempotency — prevents double send if cron retries)
    const { error: logError } = await db
      .from('birthday_reward_log')
      .insert({ customer_id: customer.id, tenant_id: customer.tenant_id, year: thisYear });

    if (logError) {
      // Already logged (race condition) — skip
      skipped++;
      continue;
    }

    // Insert pending bonus credit — claimed on next transaction
    // ON CONFLICT DO NOTHING: if customer already has an unclaimed birthday bonus, skip
    const expiresAt = new Date(now.getTime() + bonusCfg.expiry_days * 24 * 60 * 60 * 1000);
    await db
      .from('customer_bonus_credits')
      .upsert(
        {
          tenant_id:   customer.tenant_id,
          customer_id: customer.id,
          bonus_type:  'birthday',
          units:       bonusCfg.units,
          expires_at:  expiresAt.toISOString(),
        },
        { onConflict: 'customer_id,bonus_type', ignoreDuplicates: true }
      );

    await sendBirthdayMessage(
      customer.id,
      customer.tenant_id,
      customer.name,
      businessName,
      customer.phone!,
      bonusCfg.units,
      age,
      unitLabel,
    );

    queued++;
  }

  return NextResponse.json({
    eligible: eligible.length,
    queued,
    skipped,
  });
}
