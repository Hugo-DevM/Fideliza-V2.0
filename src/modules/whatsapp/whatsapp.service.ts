/**
 * WhatsApp notification service.
 *
 * Centralizes all outbound WhatsApp messages in one place.
 * Each send function mirrors the pattern of resend.ts:
 *   - typed params
 *   - fire-and-forget compatible (never throws to callers)
 *   - checks quality gate + frequency cap before enqueueing
 *
 * Messages are not sent immediately — they are inserted into
 * whatsapp_message_queue and dispatched by the /api/cron/whatsapp-send
 * cron job every 5 minutes.
 *
 * Template names must match approved Meta templates exactly (snake_case).
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { isSendingAllowed }        from '@/lib/whatsapp/quality-gate';
import { checkAndIncrementCap }    from '@/lib/whatsapp/frequency-caps';
import { getPlanLimits }           from '@/lib/config/plans';
import type { UUID }               from '@/lib/types';

type TemplateCategory = 'utility' | 'marketing';

interface EnqueueParams {
  tenantId:    UUID;
  customerId:  UUID;
  phone:       string;   // E.164 format
  template:    string;   // template name
  category:    TemplateCategory;
  params:      Record<string, string>;  // template variable values, in order
  priority?:   number;                 // lower = higher priority (default 5)
  scheduledAt?: Date;                  // earliest send time (default NOW)
}

async function enqueueMessage(p: EnqueueParams): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // 0. Plan gate — WhatsApp notifications are Starter and Pro only
  // Also resolve the sender: Pro tenants may have their own whatsapp_from
  const { data: tenant } = await db
    .from('tenants')
    .select('plan, whatsapp_from')
    .eq('id', p.tenantId)
    .single();
  if (!tenant || tenant.plan === 'free') return;

  const planLimits = getPlanLimits(tenant.plan);

  // Gate 1 — marketing templates are Pro-only
  if (p.category === 'marketing' && !planLimits.whatsappMarketing) return;

  // Gate 2 — monthly message cap (Starter: 500/month)
  if (planLimits.whatsappMonthlyLimit !== null) {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count } = await db
      .from('whatsapp_message_queue')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', p.tenantId)
      .neq('status', 'failed')
      .gte('created_at', monthStart.toISOString());
    if ((count ?? 0) >= planLimits.whatsappMonthlyLimit) return;
  }

  // Pro tenants with their own sender use it; Starter uses null (falls back to env var)
  const fromNumber: string | null = tenant.whatsapp_from ?? null;

  // Fetch program_label for unit variable (Puntos, Sellos, Visitas, etc.)
  const { data: settings } = await db
    .from('tenant_settings')
    .select('program_label')
    .eq('tenant_id', p.tenantId)
    .single();
  const unitLabel: string = settings?.program_label ?? 'Puntos';

  // 1. Quality gate — stop here if the number is in a bad state
  const allowed = await isSendingAllowed(p.category);
  if (!allowed) return;

  // 2. Frequency cap — stop here if the customer hit their monthly/weekly limit
  const underCap = await checkAndIncrementCap(p.customerId, p.tenantId, p.category);
  if (!underCap) return;

  // 3. Resolve {{unit_label}} sentinel in params
  const resolvedParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(p.params)) {
    resolvedParams[k] = v === '{{unit_label}}' ? unitLabel : v;
  }

  // 4. Insert into the queue
  await db.from('whatsapp_message_queue').insert({
    tenant_id:         p.tenantId,
    customer_id:       p.customerId,
    phone_number:      p.phone,
    from_number:       fromNumber,
    template_name:     p.template,
    template_category: p.category,
    template_params:   resolvedParams,
    priority:          p.priority ?? 5,
    scheduled_at:      p.scheduledAt?.toISOString() ?? new Date().toISOString(),
    status:            'pending',
  });
}

// ── Public send functions ────────────────────────────────────────────
// Each function is fire-and-forget. Call with void — failures are silent.

/**
 * Sent when a customer is registered with WhatsApp opt-in.
 * Template: fideliza_welcome_v2 (utility)
 * Params: [customer_name, business_name]
 */
export async function sendWelcomeMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_welcome_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': businessName,
        '3': '{{unit_label}}',
      },
      priority: 1, // welcome messages get highest priority
    });
  } catch { /* best-effort — never blocks customer creation */ }
}

/**
 * Sent by the daily voucher-expiry cron when a voucher is about to expire.
 * Template: fideliza_voucher_expiry_v2 (utility)
 * Params: [customer_name, reward_name, business_name, days_left]
 */
export async function sendVoucherExpiryReminder(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  rewardName:   string,
  daysLeft:     number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_voucher_expiry_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': rewardName,
        '3': businessName,
        '4': String(daysLeft),
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent manually by the business owner from the dashboard.
 * Template: fideliza_balance_reminder_v2 (utility)
 * Params: [customer_name, current_points, business_name, points_needed, reward_name]
 */
export async function sendBalanceReminder(
  customerId:    UUID,
  tenantId:      UUID,
  customerName:  string,
  businessName:  string,
  phone:         string,
  currentPoints: number,
  pointsNeeded:  number,
  rewardName:    string,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_balance_reminder_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': String(currentPoints),
        '3': businessName,
        '4': String(pointsNeeded),
        '5': rewardName,
        '6': '{{unit_label}}',
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent by the weekly reactivation cron to customers inactive for 21+ days.
 * Template: fideliza_reactivation_v2 (marketing)
 * Params: [customer_name, business_name, bonus_points]
 */
export async function sendReactivationMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  bonusPoints:  number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_reactivation_v2',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(bonusPoints),
        '4': '{{unit_label}}',
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent when a customer's streak is about to break (future — streak feature).
 * Template: fideliza_streak_at_risk_v2 (marketing)
 * Params: [customer_name, streak_weeks, business_name]
 */
export async function sendStreakAtRiskMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  streakWeeks:  number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_streak_at_risk_v2',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': String(streakWeeks),
        '3': businessName,
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent on the customer's birthday by the daily birthday-rewards cron.
 *
 * Two templates depending on whether we know the customer's birth year:
 *
 * fideliza_birthday_v2 (with age) — {{1}} name, {{2}} business, {{3}} bonus,
 *   {{4}} age, {{5}} unit_label
 *
 * fideliza_birthday_no_age_v2 (without age) — {{1}} name, {{2}} business,
 *   {{3}} bonus, {{4}} unit_label
 */
export async function sendBirthdayMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  bonusPoints:  number,
  age:          number | null,
  unitLabel:    string,
): Promise<void> {
  try {
    const hasAge = age !== null;
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: hasAge ? 'fideliza_birthday_v3' : 'fideliza_birthday_no_age_v2',
      category: 'marketing',
      params: hasAge
        ? {
            '1': customerName,
            '2': businessName,
            '3': String(bonusPoints),
            '4': String(age),
            '5': unitLabel,
          }
        : {
            '1': customerName,
            '2': businessName,
            '3': String(bonusPoints),
            '4': unitLabel,
          },
      priority: 2,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent post-earn when a customer crosses the 80% threshold toward a reward.
 * Template: fideliza_milestone_80_v2 (utility)
 * Params: [customer_name, business_name, units_remaining, reward_name]
 */
export async function sendMilestone80Message(
  customerId:    UUID,
  tenantId:      UUID,
  customerName:  string,
  businessName:  string,
  phone:         string,
  unitsRemaining: number,
  rewardName:    string,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_milestone_80_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(unitsRemaining),
        '4': rewardName,
        '5': '{{unit_label}}',
      },
      priority: 3,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent manually by the business owner as a promotion blast.
 * Template: fideliza_promotion_v2 (marketing)
 * Params: [customer_name, business_name]
 */
export async function sendPromotionMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_promotion_v2',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': businessName,
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent to the referred customer at registration when they have a referral code.
 * Template: fideliza_referral_welcome_v2 (utility)
 * Params: [referred_name, business_name, referred_bonus, referrer_name]
 */
export async function sendReferralWelcomeMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  referredBonus: number,
  referrerName: string,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_referral_welcome_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(referredBonus),
        '4': referrerName,
        '5': '{{unit_label}}',
      },
      priority: 2,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent to the referrer when their referred customer completes their first earn.
 * Template: fideliza_referral_earned_v2 (utility)
 * Params: [referrer_name, referred_name, referrer_bonus, business_name]
 */
export async function sendReferralEarnedMessage(
  customerId:    UUID,
  tenantId:      UUID,
  referrerName:  string,
  referredName:  string,
  phone:         string,
  referrerBonus: number,
  businessName:  string,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_referral_earned_v2',
      category: 'utility',
      params: {
        '1': referrerName,
        '2': referredName,
        '3': String(referrerBonus),
        '4': businessName,
        '5': '{{unit_label}}',
      },
      priority: 2,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent when a Surprise & Delight event fires on an earn.
 * Template: fideliza_surprise_v2 (marketing)
 * Params: [customer_name, business_name, multiplier]
 */
export async function sendSurpriseDelightMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  multiplier:   number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_surprise_v2',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(multiplier),
        '4': '{{unit_label}}',
      },
      priority: 3,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent when a customer completes a challenge and receives a bonus.
 * Template: fideliza_challenge_completed_v2 (utility)
 * Params: [customer_name, challenge_title, bonus_points, business_name]
 */
export async function sendChallengeCompletedMessage(
  customerId:     UUID,
  tenantId:       UUID,
  customerName:   string,
  businessName:   string,
  phone:          string,
  challengeTitle: string,
  bonusPoints:    number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_challenge_completed_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': challengeTitle,
        '3': String(bonusPoints),
        '4': businessName,
        '5': '{{unit_label}}',
      },
      priority: 2,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent when a customer crosses a tier threshold (Bronze→Silver, Silver→Gold).
 * Template: fideliza_tier_upgrade_v2 (utility)
 * Params: [customer_name, business_name, tier_label, multiplier]
 */
export async function sendTierUpgradeMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  tierLabel:    string,
  multiplier:   number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_tier_upgrade_v2',
      category: 'utility',
      params: {
        '1': customerName,
        '2': businessName,
        '3': tierLabel,
        '4': String(multiplier),
        '5': '{{unit_label}}',
      },
      priority: 2,
    });
  } catch { /* best-effort */ }
}
