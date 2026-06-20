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
import type { UUID }               from '@/lib/types';

type TemplateCategory = 'utility' | 'marketing';

interface EnqueueParams {
  tenantId:    UUID;
  customerId:  UUID;
  phone:       string;   // E.164 format
  template:    string;   // Meta template name
  category:    TemplateCategory;
  params:      Record<string, string>;  // template variable values, in order
  priority?:   number;                 // lower = higher priority (default 5)
  scheduledAt?: Date;                  // earliest send time (default NOW)
}

async function enqueueMessage(p: EnqueueParams): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // 0. Plan gate — WhatsApp notifications are Starter and Pro only
  const { data: tenant } = await db
    .from('tenants')
    .select('plan')
    .eq('id', p.tenantId)
    .single();
  if (!tenant || tenant.plan === 'free') return;

  // 1. Quality gate — stop here if the number is in a bad state
  const allowed = await isSendingAllowed(p.category);
  if (!allowed) return;

  // 2. Frequency cap — stop here if the customer hit their monthly/weekly limit
  const underCap = await checkAndIncrementCap(p.customerId, p.tenantId, p.category);
  if (!underCap) return;

  // 3. Insert into the queue
  await db.from('whatsapp_message_queue').insert({
    tenant_id:         p.tenantId,
    customer_id:       p.customerId,
    phone_number:      p.phone,
    template_name:     p.template,
    template_category: p.category,
    template_params:   p.params,
    priority:          p.priority ?? 5,
    scheduled_at:      p.scheduledAt?.toISOString() ?? new Date().toISOString(),
    status:            'pending',
  });
}

// ── Public send functions ────────────────────────────────────────────
// Each function is fire-and-forget. Call with void — failures are silent.

/**
 * Sent when a customer is registered with WhatsApp opt-in.
 * Template: fideliza_welcome_v1 (utility)
 * Params: [customer_name, business_name]
 */
export async function sendWelcomeMessage(
  customerId:   UUID,
  tenantId:     UUID,
  customerName: string,
  businessName: string,
  phone:        string,
  initialPoints: number,
): Promise<void> {
  try {
    await enqueueMessage({
      tenantId,
      customerId,
      phone,
      template: 'fideliza_welcome_v1',
      category: 'utility',
      params: {
        '1': customerName,
        '2': businessName,
      },
      priority: 1, // welcome messages get highest priority
    });
  } catch { /* best-effort — never blocks customer creation */ }
}

/**
 * Sent by the daily voucher-expiry cron when a voucher is about to expire.
 * Template: fideliza_voucher_expiry_v1 (utility)
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
      template: 'fideliza_voucher_expiry_v1',
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
 * Template: fideliza_balance_reminder_v1 (utility)
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
      template: 'fideliza_balance_reminder_v1',
      category: 'utility',
      params: {
        '1': customerName,
        '2': String(currentPoints),
        '3': businessName,
        '4': String(pointsNeeded),
        '5': rewardName,
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent by the weekly reactivation cron to customers inactive for 21+ days.
 * Template: fideliza_reactivation_v1 (marketing)
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
      template: 'fideliza_reactivation_v1',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(bonusPoints),
      },
    });
  } catch { /* best-effort */ }
}

/**
 * Sent when a customer's streak is about to break (future — streak feature).
 * Template: fideliza_streak_at_risk_v1 (marketing)
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
      template: 'fideliza_streak_at_risk_v1',
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
 * Template: fideliza_birthday_v1 (marketing)
 * Params: [customer_name, business_name, bonus_points]
 */
export async function sendBirthdayMessage(
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
      template: 'fideliza_birthday_v1',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(bonusPoints),
      },
      priority: 2,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent post-earn when a customer crosses the 80% threshold toward a reward.
 * Template: fideliza_milestone_80_v1 (utility)
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
      template: 'fideliza_milestone_80_v1',
      category: 'utility',
      params: {
        '1': customerName,
        '2': businessName,
        '3': String(unitsRemaining),
        '4': rewardName,
      },
      priority: 3,
    });
  } catch { /* best-effort */ }
}

/**
 * Sent manually by the business owner as a promotion blast.
 * Template: fideliza_promotion_v1 (marketing)
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
      template: 'fideliza_promotion_v1',
      category: 'marketing',
      params: {
        '1': customerName,
        '2': businessName,
      },
    });
  } catch { /* best-effort */ }
}
