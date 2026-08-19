/**
 * Transaction service — business logic for earning, redeeming, and querying points.
 *
 * IMPORTANT: earn and redeem operations call Supabase RPC functions, NOT direct
 * JS sequential DB calls. This is intentional — the RPC functions run inside a
 * single PostgreSQL transaction, giving us ACID guarantees that JS sequential
 * calls cannot provide. See migration 004_rpc_functions.sql.
 */

import { after } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { BadRequestError, NotFoundError } from '@/lib/middleware/errors';
import { getTransactionHistoryLimit } from '@/lib/middleware/plan-limits';
import { logger } from '@/lib/utils/logger';
import { getNotificationPrefs } from '@/lib/email/notification-prefs';
import { sendRedemptionNotification } from '@/lib/email/resend';
import {
  sendMilestone80Message,
  sendTierUpgradeMessage,
  sendSurpriseDelightMessage,
  sendReferralEarnedMessage,
  sendChallengeCompletedMessage,
} from '@/modules/whatsapp/whatsapp.service';
import { computeTier, computeLoyaltyDelta, computeActivityScore } from '@/lib/utils/tiers';
import { isFlashOfferActive, parseFlashOffer } from '@/lib/utils/flash-offer';
import { defaultReferralBonuses } from '@/lib/config/referral-bonuses';
import { getTierScore } from '@/lib/utils/tier-score';
import type { TierConfig, TenantTierSettings, TierWindowSettings } from '@/lib/utils/tiers';
import type {
  Transaction,
  CustomerRewardRedemption,
  UUID,
} from '@/lib/types';
import type { CreateTransactionInput } from '@/lib/validation/transaction.schema';
import type { RedeemRewardInput } from '@/lib/validation/reward.schema';

/**
 * Records a points transaction (earn, adjustment, expire, refund).
 * Calls rpc_earn_points for earn type; handles adjustments directly.
 */
export async function processTransaction(
  tenantId: UUID,
  input: CreateTransactionInput
): Promise<Transaction> {
  const db = createServiceRoleClient();

  if (input.type === 'earn') {
    // ── Flash Offer + Head Start modifiers ───────────────────────────────────
    let effectiveDelta = input.points_delta;
    let effectiveNote  = input.note ?? undefined;

    // Fetch program config+type, tenant tier settings, and enrollment in parallel
    const [programRes, tierSettingsRes, enrollmentRes] = await Promise.all([
      db.from('reward_programs')
        .select('config, type')
        .eq('id', input.program_id)
        .eq('tenant_id', tenantId)
        .single(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.from('tenant_settings') as any)
        .select('tiers_enabled, tiers, tier_score_per_stamp, tier_score_per_visit, tier_score_per_point, tier_score_per_cashback_cent, tier_window_months, tier_grandfather_until, birthday_bonus_points, birthday_bonus_stamps, birthday_bonus_visits, reactivation_bonus_points, reactivation_bonus_stamps, reactivation_bonus_visits')
        .eq('tenant_id', tenantId)
        .maybeSingle() as Promise<{ data: (TenantTierSettings & TierWindowSettings & {
          birthday_bonus_points?: number; birthday_bonus_stamps?: number; birthday_bonus_visits?: number;
          reactivation_bonus_points?: number; reactivation_bonus_stamps?: number; reactivation_bonus_visits?: number;
        }) | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.from('customers') as any)
        .select('loyalty_score, tier_label, tier_color')
        .eq('id', input.customer_id)
        .eq('tenant_id', tenantId)
        .maybeSingle() as Promise<{ data: { loyalty_score: number; tier_label: string | null; tier_color: string | null } | null }>,
    ]);

    const cfg         = (programRes.data?.config ?? {}) as Record<string, unknown>;
    const programType = (programRes.data?.type ?? 'points') as string;
    const tierSettings: TenantTierSettings = {
      tiers_enabled:                Boolean(tierSettingsRes.data?.tiers_enabled),
      tiers:                        (tierSettingsRes.data?.tiers as TierConfig[] | undefined) ?? [],
      tier_score_per_stamp:         Number(tierSettingsRes.data?.tier_score_per_stamp ?? 10),
      tier_score_per_visit:         Number(tierSettingsRes.data?.tier_score_per_visit ?? 10),
      tier_score_per_point:         Number(tierSettingsRes.data?.tier_score_per_point ?? 1),
      tier_score_per_cashback_cent: Number(tierSettingsRes.data?.tier_score_per_cashback_cent ?? 0.1),
    };
    const lifetimeLoyalty = enrollmentRes.data?.loyalty_score ?? 0;
    const tierWindow: TierWindowSettings = {
      tier_window_months:     (tierSettingsRes.data?.tier_window_months as number | null | undefined) ?? null,
      tier_grandfather_until: (tierSettingsRes.data?.tier_grandfather_until as string | null | undefined) ?? null,
    };

    // The score the tier is decided from. Equals lifetimeLoyalty unless the
    // tenant enabled a rolling window, in which case a customer who stopped
    // coming can drop back down.
    const { score: loyaltyScore } = tierSettings.tiers_enabled
      ? await getTierScore({
          tenantId,
          customerId:    input.customer_id,
          lifetimeScore: lifetimeLoyalty,
          settings:      tierWindow,
        })
      : { score: lifetimeLoyalty };

    // Fetch enrollment for Head Start (lifetime_points check)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingEnrollment } = await (db.from('customer_program_enrollments') as any)
      .select('lifetime_points')
      .eq('customer_id', input.customer_id)
      .eq('program_id', input.program_id)
      .maybeSingle() as { data: { lifetime_points: number } | null };

    const lifetimePoints = existingEnrollment?.lifetime_points ?? 0;

    // Capture base delta BEFORE multipliers — used for loyalty score calculation
    const baseDelta = effectiveDelta;

    // Universal Tier VIP multiplier — derived from customer's loyalty_score (global)
    if (tierSettings.tiers_enabled && tierSettings.tiers.length > 0) {
      const tier = computeTier(loyaltyScore, tierSettings.tiers);
      if (tier && tier.multiplier > 1) {
        effectiveDelta = Math.round(effectiveDelta * tier.multiplier);
        effectiveNote  = effectiveNote
          ? `${effectiveNote} · ${tier.label} ${tier.multiplier}×`
          : `${tier.label} ${tier.multiplier}×`;
      }
    }

    // Flash Offer: multiply points if active window matches current time.
    // La ventana se evalúa en lib/utils/flash-offer.ts, el mismo módulo que usa
    // el banner del portal — si divergieran, el portal anunciaría un
    // multiplicador que el earn no aplica.
    const flashOffer = isFlashOfferActive(cfg) ? parseFlashOffer(cfg) : null;
    if (flashOffer) {
      const mult = flashOffer.multiplier;
      effectiveDelta = Math.round(effectiveDelta * mult);
      effectiveNote  = effectiveNote
        ? `${effectiveNote} · Flash ${mult}x`
        : `Flash ${mult}x`;
    }

    // Head Start: bonus points on a customer's very first earn in this program
    const initialBonus = Number(cfg.initial_bonus ?? 0);
    if (initialBonus > 0 && lifetimePoints === 0) {
      effectiveDelta += initialBonus;
      effectiveNote   = effectiveNote
        ? `${effectiveNote} · +${initialBonus} bienvenida`
        : `+${initialBonus} bienvenida`;
    }

    // Pending Bonus Credit: claim the oldest unclaimed birthday/reactivation bonus
    // for this customer. Only one bonus is claimed per transaction (program-specific).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = db as any;
    const { data: pendingBonus } = await dbAny.from('customer_bonus_credits')
      .select('id, units, bonus_type')
      .eq('customer_id', input.customer_id)
      .eq('tenant_id', tenantId)
      .is('claimed_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle() as { data: { id: string; units: number; bonus_type: string } | null };

    if (pendingBonus) {
      // Resolve the correct bonus amount for this program type from tenant config.
      // Each type has its own configured amount so the business controls how many
      // stamps/visits/points to give per campaign independently.
      const isBirthday = pendingBonus.bonus_type === 'birthday';
      let bonusUnits: number;
      if (programType === 'stamp') {
        bonusUnits = isBirthday
          ? (tierSettingsRes.data?.birthday_bonus_stamps     ?? 1)
          : (tierSettingsRes.data?.reactivation_bonus_stamps ?? 1);
      } else if (programType === 'visit') {
        bonusUnits = isBirthday
          ? (tierSettingsRes.data?.birthday_bonus_visits     ?? 1)
          : (tierSettingsRes.data?.reactivation_bonus_visits ?? 1);
      } else {
        // points & cashback — use the stored units (set by cron from tenant config)
        bonusUnits = isBirthday
          ? (tierSettingsRes.data?.birthday_bonus_points     ?? pendingBonus.units)
          : (tierSettingsRes.data?.reactivation_bonus_points ?? pendingBonus.units);
      }

      const bonusLabel = isBirthday ? 'cumpleaños' : 'reactivación';
      const unitLabel  = programType === 'stamp' ? 'sello' : programType === 'visit' ? 'visita' : 'pts';

      effectiveDelta += bonusUnits;
      effectiveNote   = effectiveNote
        ? `${effectiveNote} · +${bonusUnits} ${unitLabel} bono ${bonusLabel}`
        : `+${bonusUnits} ${unitLabel} bono ${bonusLabel}`;

      // Mark claimed immediately (before rpc_earn_points so it's already done if RPC fails)
      void dbAny.from('customer_bonus_credits')
        .update({ claimed_at: new Date().toISOString(), claimed_program_id: input.program_id })
        .eq('id', pendingBonus.id);
    }

    // Surprise & Delight: random multiplier with configured probability (Pro only)
    let surpriseFired = false;
    const surpriseMult = Number(cfg.surprise_multiplier ?? 2);
    if (cfg.surprise_enabled) {
      const prob = Number(cfg.surprise_probability ?? 0.10);
      if (Math.random() < prob) {
        effectiveDelta = Math.round(effectiveDelta * surpriseMult);
        effectiveNote  = effectiveNote
          ? `${effectiveNote} · 🎲 Surprise ${surpriseMult}×`
          : `🎲 Surprise ${surpriseMult}×`;
        surpriseFired = true;
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    const { data, error } = await db.rpc('rpc_earn_points', {
      p_tenant_id:    tenantId,
      p_customer_id:  input.customer_id,
      p_program_id:   input.program_id,
      p_points_delta: effectiveDelta,
      p_note:         effectiveNote,
      p_staff_id:     input.staff_id ?? undefined,
    });

    if (error) {
      logger.error('rpc_earn_points failed', { error: error.message, tenantId });
      // Map DB error codes to user-facing messages
      if (error.message.includes('P0002')) throw new BadRequestError('El monto de puntos debe ser positivo para transacciones de ganancia');
      if (error.message.includes('P0003')) throw new NotFoundError('Cliente');
      if (error.message.includes('P0004')) throw new BadRequestError('Programa no encontrado o inactivo');
      throw new Error(`Transacción fallida: ${error.message}`);
    }

    const tx = data as unknown as Transaction;

    // ── Deferred side effects ────────────────────────────────────────────────
    // The four blocks below can each enqueue a WhatsApp message for the SAME
    // customer on a single earn (tier upgrade, challenge, surprise, 80% nudge).
    // They are defined here and awaited in a fixed sequence at the end of the
    // block — running them concurrently made the arrival order a race.
    //
    // They are scheduled with `after()` (next/server), NOT a bare `void`. On a
    // serverless host the response returning is the signal to freeze the
    // container: anything still pending in the event loop freezes with it and
    // may never resume. `after()` keeps the invocation alive until the work is
    // done, without delaying the response the cashier sees. The 80% nudge runs
    // last, so it was the one most often lost.
    // ── Activity score ───────────────────────────────────────────────────────
    // Stamps the normalised value of this earn onto the transaction row, which
    // is what the monthly ranking sums over. It has to be a separate UPDATE
    // because the row itself is created inside rpc_earn_points, where this
    // value is not available.
    //
    // Written for every tenant, including those without VIP tiers — the ranking
    // does not depend on the tier system being on.
    const recordActivityScore = async (): Promise<void> => {
      try {
        const score = computeActivityScore(programType, baseDelta, tierSettings);
        if (score <= 0) return;
        await createServiceRoleClient()
          .from('transactions')
          .update({ loyalty_delta: score })
          .eq('id', tx.id);
      } catch { /* best-effort — a missing score only affects the ranking */ }
    };

    const updateLoyaltyAndNotifyTier = async (): Promise<void> => {
      try {
        const loyaltyDelta = computeLoyaltyDelta(programType, baseDelta, tierSettings);
        if (loyaltyDelta <= 0) return;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: newScore, error: scoreErr } = await (db as any).rpc('rpc_add_loyalty_score', {
          p_tenant_id:   tenantId,
          p_customer_id: input.customer_id,
          p_delta:       loyaltyDelta,
        });

        if (scoreErr || newScore === null) return;

        // The RPC returns the LIFETIME score, which is only the right basis when
        // the tenant has no rolling window. Deriving "after" from the score the
        // tier was actually decided from keeps both modes correct.
        const newLoyaltyScore = loyaltyScore + loyaltyDelta;
        const tierBefore = computeTier(loyaltyScore, tierSettings.tiers);
        const tierAfter  = computeTier(newLoyaltyScore, tierSettings.tiers);

        // Update cached tier on customers table.
        // Must be awaited: a Supabase query builder is lazy and only issues its
        // request when it is awaited (fetch lives inside `then`). A bare `void`
        // discarded the builder without ever running the UPDATE, which is why
        // customers.tier_label stayed null everywhere it is displayed.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (db.from('customers') as any)
          .update({ tier_label: tierAfter?.label ?? null, tier_color: tierAfter?.color ?? null })
          .eq('id', input.customer_id)
          .eq('tenant_id', tenantId);

        // Fire tier upgrade notification if customer moved to a higher tier
        if (
          tierAfter && tierBefore &&
          tierAfter.min_lifetime > tierBefore.min_lifetime
        ) {
          const db2 = createServiceRoleClient();

          // Gift voucher for the new tier, when the business configured one.
          // The RPC is a no-op if the customer already received this tier's
          // gift, so the revalidation window cannot be farmed by oscillating
          // around the threshold. Non-fatal: a missing gift must not stop the
          // upgrade notification below.
          if (tierAfter.gift_label?.trim()) {
            try {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              await (db2 as any).rpc('rpc_grant_tier_gift', {
                p_tenant_id:   tenantId,
                p_customer_id: input.customer_id,
                p_tier_min:    tierAfter.min_lifetime,
                p_gift_label:  tierAfter.gift_label,
                p_expiry_days: tierAfter.gift_expiry_days ?? null,
              });
            } catch { /* best-effort */ }
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: customer } = await (db2.from('customers') as any)
            .select('name, phone, whatsapp_opt_in')
            .eq('id', input.customer_id)
            .eq('tenant_id', tenantId)
            .eq('whatsapp_opt_in', true)
            .maybeSingle() as { data: { name: string; phone: string | null } | null };

          if (customer?.phone) {
            const { data: tenantRow } = await db2
              .from('tenants')
              .select('name')
              .eq('id', tenantId)
              .single() as { data: { name: string } | null };

            await sendTierUpgradeMessage(
              input.customer_id,
              tenantId,
              customer.name,
              tenantRow?.name ?? '',
              customer.phone,
              tierAfter.label,
              tierAfter.multiplier,
            );
          }
        }
      } catch { /* best-effort — never blocks the earn */ }
    };

    // ── 80% milestone notification ───────────────────────────────────────────
    const notifyMilestone80 = async (): Promise<void> => {
      try {
        const balanceAfter  = tx.balance_after;
        const balanceBefore = balanceAfter - effectiveDelta;

        // Fetch cheapest active reward to determine the program goal
        const db2 = createServiceRoleClient();
        const { data: cheapestReward } = await db2
          .from('rewards')
          .select('cost_points, name')
          .eq('program_id', input.program_id)
          .eq('is_active', true)
          .order('cost_points', { ascending: true })
          .limit(1)
          .maybeSingle() as { data: { cost_points: number; name: string } | null };

        if (!cheapestReward || cheapestReward.cost_points <= 0) return;

        const goal = cheapestReward.cost_points;
        const crossedThreshold = balanceBefore / goal < 0.8 && balanceAfter / goal >= 0.8;
        if (!crossedThreshold) return;

        // Check tenant setting
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: settings } = await (db2.from('tenant_settings') as any)
          .select('wa_notify_milestone_80, tenants!inner(name)')
          .eq('tenant_id', tenantId)
          .eq('wa_notify_milestone_80', true)
          .maybeSingle() as { data: { wa_notify_milestone_80: boolean; tenants: { name: string } | null } | null };

        if (!settings) return;

        const businessName = (settings.tenants as { name: string } | null)?.name ?? '';

        // Fetch customer
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: customer } = await (db2.from('customers') as any)
          .select('name, phone, whatsapp_opt_in')
          .eq('id', input.customer_id)
          .eq('tenant_id', tenantId)
          .eq('whatsapp_opt_in', true)
          .maybeSingle() as { data: { name: string; phone: string | null; whatsapp_opt_in: boolean } | null };

        if (!customer?.phone) return;

        const unitsRemaining = Math.max(0, goal - balanceAfter);

        await sendMilestone80Message(
          input.customer_id,
          tenantId,
          customer.name,
          businessName,
          customer.phone,
          unitsRemaining,
          cheapestReward.name,
        );
      } catch { /* best-effort — never blocks the earn */ }
    };

    // Note: tier upgrade notification is handled inside the loyalty score block above.
    // ── Surprise & Delight notification ──────────────────────────────────────
    const notifySurpriseDelight = async (): Promise<void> => {
      if (!surpriseFired) return;
      try {
        const db2 = createServiceRoleClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: customer } = await (db2.from('customers') as any)
          .select('name, phone, whatsapp_opt_in')
          .eq('id', input.customer_id)
          .eq('tenant_id', tenantId)
          .eq('whatsapp_opt_in', true)
          .maybeSingle() as { data: { name: string; phone: string | null } | null };

        if (!customer?.phone) return;

        const { data: tenantRow } = await db2
          .from('tenants')
          .select('name')
          .eq('id', tenantId)
          .single() as { data: { name: string } | null };

        await sendSurpriseDelightMessage(
          input.customer_id,
          tenantId,
          customer.name,
          tenantRow?.name ?? '',
          customer.phone,
          surpriseMult,
        );
      } catch { /* best-effort — never blocks the earn */ }
    };
    // ── Referral completion hook ─────────────────────────────────────────────
    // Runs on every earn, NOT only when lifetimePoints === 0.
    //
    // That guard looked like a cheap optimisation but silently killed the whole
    // payout for anyone who signed up through the portal referral link:
    // registerReferredCustomerAction credits their welcome bonus with
    // rpc_earn_points at registration, so their enrollment already has
    // lifetime_points > 0 by the time they make their first real purchase — and
    // the hook never fired.
    //
    // Single-fire is guaranteed by the atomic `UPDATE ... WHERE status='pending'`
    // below, not by this condition, so dropping it costs one UPDATE that matches
    // zero rows for customers without a pending referral. It runs inside after(),
    // so it never delays the response.
    {
      after(async () => {
        try {
          const db2 = createServiceRoleClient();

          // Atomically complete the referral. `status='pending'` in the WHERE is the
          // idempotency guard on its own: the same statement flips it to 'completed',
          // so a concurrent second earn finds nothing.
          //
          // program_id is NOT part of the filter and is NOT overwritten — it carries
          // which signup path created the referral, and that decides whether the
          // referred customer still needs their welcome bonus (see below):
          //   null     → dashboard signup (createCustomerAction) — bonus not paid yet
          //   set      → portal referral link (registerReferredCustomerAction) — bonus
          //              already credited at registration
          // Filtering on `is('program_id', null)` used to exclude the portal path
          // entirely, so those referrers never got paid and never got notified.
          const { data: referral } = await db2
            .from('referrals')
            .update({
              status:       'completed',
              completed_at: new Date().toISOString(),
            })
            .eq('tenant_id',   tenantId)
            .eq('referred_id', input.customer_id)
            .eq('status',      'pending')
            .select('id, referrer_id, referred_id, program_id')
            .maybeSingle();

          if (!referral) return; // No pending referral or already completed

          // True only for the dashboard path, where nothing has been credited yet.
          const referredBonusPending = referral.program_id === null;

          // Fetch referral bonuses from tenant settings
          const { data: tsRow } = await db2
            .from('tenant_settings')
            .select('referral_program_configs')
            .eq('tenant_id', tenantId)
            .single() as { data: { referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }> } | null };

          const programConfig = tsRow?.referral_program_configs?.[input.program_id];
          // Same defaults the business is shown in /dashboard/referidos. A
          // literal here is how an unconfigured VISIT program ended up paying
          // 100 visits instead of the 3 the screen advertised.
          const fallback      = defaultReferralBonuses(programType);
          const referrerBonus = programConfig?.referrer_bonus ?? fallback.referrer;
          const referredBonus = programConfig?.referred_bonus ?? fallback.referred;

          // Credit referrer bonus
          if (referrerBonus > 0) {
            await db2.rpc('rpc_earn_points', {
              p_tenant_id:    tenantId,
              p_customer_id:  referral.referrer_id,
              p_program_id:   input.program_id,
              p_points_delta: referrerBonus,
              p_note:         '🎁 Bono por referido',
            });
          }

          // Credit referred bonus (on top of their normal earn) — only when the
          // signup path did not already pay it. The portal link credits it at
          // registration, so crediting again here would double it.
          if (referredBonusPending && referredBonus > 0) {
            await db2.rpc('rpc_earn_points', {
              p_tenant_id:    tenantId,
              p_customer_id:  referral.referred_id,
              p_program_id:   input.program_id,
              p_points_delta: referredBonus,
              p_note:         '🎁 Bono de bienvenida por referido',
            });
          }

          // Record which program the referral completed in (informational only —
          // the status flip above is what guarantees single-fire).
          if (referredBonusPending) {
            await db2
              .from('referrals')
              .update({ program_id: input.program_id })
              .eq('id', referral.id);
          }

          // WhatsApp notification to referrer
          const { data: referrerCustomer } = await db2.from('customers')
            .select('name, phone, whatsapp_opt_in')
            .eq('id', referral.referrer_id)
            .eq('whatsapp_opt_in', true)
            .maybeSingle();

          if (!referrerCustomer?.phone) return;

          const { data: referredCustomer } = await db2.from('customers')
            .select('name')
            .eq('id', referral.referred_id)
            .maybeSingle();

          const { data: tenantRow } = await db2
            .from('tenants')
            .select('name')
            .eq('id', tenantId)
            .single() as { data: { name: string } | null };

          await sendReferralEarnedMessage(
            referral.referrer_id,
            tenantId,
            referrerCustomer.name,
            referredCustomer?.name ?? 'Tu amigo',
            referrerCustomer.phone,
            referrerBonus,
            tenantRow?.name ?? '',
          );
        } catch { /* best-effort — never blocks the earn */ }
      });
    }
    // ── Challenge progress hook ──────────────────────────────────────────────
    const notifyChallengeProgress = async (): Promise<void> => {
      try {
        const db2 = createServiceRoleClient();
        const now  = new Date().toISOString();

        // Fetch active challenges for this program within their time window
        const { data: activeChallenges } = await db2
          .from('challenges')
          .select('id, title, target, bonus_points')
          .eq('tenant_id', tenantId)
          .eq('program_id', input.program_id)
          .eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`);

        if (!activeChallenges?.length) return;

        // Fetch customer and tenant once — reused for every challenge notification
        const [{ data: customer }, { data: tenantRow }] = await Promise.all([
          db2
            .from('customers')
            .select('name, phone, whatsapp_opt_in')
            .eq('id', input.customer_id)
            .eq('tenant_id', tenantId)
            .eq('whatsapp_opt_in', true)
            .maybeSingle(),
          db2
            .from('tenants')
            .select('name')
            .eq('id', tenantId)
            .single(),
        ]);

        for (const challenge of activeChallenges) {
          // Fetch or create progress row
          const { data: existing } = await db2
            .from('customer_challenge_progress')
            .select('id, progress, completed_at')
            .eq('customer_id', input.customer_id)
            .eq('challenge_id', challenge.id)
            .maybeSingle();

          // Skip if already completed
          if (existing?.completed_at) continue;

          const newProgress = (existing?.progress ?? 0) + 1;

          if (existing) {
            await db2
              .from('customer_challenge_progress')
              .update({ progress: newProgress })
              .eq('id', existing.id);
          } else {
            await db2
              .from('customer_challenge_progress')
              .insert({
                tenant_id:    tenantId,
                customer_id:  input.customer_id,
                challenge_id: challenge.id,
                progress:     newProgress,
              });
          }

          // Check completion
          if (newProgress >= challenge.target) {
            // Mark completed
            await db2
              .from('customer_challenge_progress')
              .update({ completed_at: now })
              .eq('customer_id', input.customer_id)
              .eq('challenge_id', challenge.id);

            // Credit bonus points
            await db2.rpc('rpc_earn_points', {
              p_tenant_id:    tenantId,
              p_customer_id:  input.customer_id,
              p_program_id:   input.program_id,
              p_points_delta: challenge.bonus_points,
              p_note:         `Misión completada: ${challenge.title}`,
            });

            // WhatsApp notification
            if (customer?.phone) {
              await sendChallengeCompletedMessage(
                input.customer_id,
                tenantId,
                customer.name,
                tenantRow?.name ?? '',
                customer.phone,
                challenge.title,
                challenge.bonus_points,
              );
            }
          }
        }
      } catch { /* best-effort — never blocks the earn */ }
    };

    // Run the same-customer notifications in a fixed order, biggest event first:
    // tier upgrade → challenge completed → surprise → 80% nudge. Sequential on
    // purpose — each message must land in the queue before the next is inserted,
    // otherwise the arrival order depends on which Supabase call returns first.
    // The referral hook above stays concurrent: it notifies the REFERRER, a
    // different customer, so it never competes for this customer's ordering.
    after(async () => {
      await recordActivityScore();
      await updateLoyaltyAndNotifyTier();
      await notifyChallengeProgress();
      await notifySurpriseDelight();
      await notifyMilestone80();
    });
    // ────────────────────────────────────────────────────────────────────────

    return tx;
  }

  // For adjustments, expire, refund — direct insert with manual balance calculation
  // These are staff-initiated operations, not customer-facing
  const { data: enrollment, error: enrollmentErr } = await db
    .from('customer_program_enrollments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', input.customer_id)
    .eq('program_id', input.program_id)
    .single();

  if (enrollmentErr || !enrollment) {
    throw new NotFoundError('Inscripción — el cliente debe estar inscrito en este programa primero');
  }

  const newBalance = enrollment.current_points + input.points_delta;

  if (newBalance < 0) {
    throw new BadRequestError(
      `El ajuste resultaría en un saldo negativo. Actual: ${enrollment.current_points}, Delta: ${input.points_delta}`
    );
  }

  // Update enrollment balance
  const { error: updateErr } = await db
    .from('customer_program_enrollments')
    .update({
      current_points:   newBalance,
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', enrollment.id);

  if (updateErr) {
    throw new Error(`Error al actualizar la inscripción: ${updateErr.message}`);
  }

  // Insert transaction
  const { data: tx, error: txErr } = await db
    .from('transactions')
    .insert({
      tenant_id:     tenantId,
      customer_id:   input.customer_id,
      program_id:    input.program_id,
      enrollment_id: enrollment.id,
      type:          input.type,
      points_delta:  input.points_delta,
      balance_after: newBalance,
      note:          input.note ?? null,
      staff_id:      input.staff_id ?? null,
    })
    .select('*')
    .single();

  if (txErr || !tx) {
    throw new Error(`Error al registrar la transacción: ${txErr?.message}`);
  }

  return tx as Transaction;
}

/**
 * Redeems a reward for a customer using the atomic RPC function.
 */
export async function redeemReward(
  tenantId: UUID,
  input: RedeemRewardInput
): Promise<CustomerRewardRedemption> {
  const db = createServiceRoleClient();

  // ── Tier gate ────────────────────────────────────────────────────────────
  // Enforced here and not only in the UI: the portal hides the button, but the
  // redeem endpoint is reachable directly, and rpc_redeem_reward knows nothing
  // about tiers. This is the only thing actually protecting the restriction.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rewardRow } = await (db.from('rewards') as any)
    .select('min_tier_score, name')
    .eq('id', input.reward_id)
    .eq('tenant_id', tenantId)
    .maybeSingle() as { data: { min_tier_score: number | null; name: string } | null };

  if (rewardRow?.min_tier_score != null) {
    const [{ data: settingsRow }, { data: customerRow }] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.from('tenant_settings') as any)
        .select('tiers, tiers_enabled, tier_window_months, tier_grandfather_until')
        .eq('tenant_id', tenantId)
        .maybeSingle() as Promise<{ data: (TierWindowSettings & { tiers: TierConfig[] | null; tiers_enabled: boolean }) | null }>,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (db.from('customers') as any)
        .select('loyalty_score')
        .eq('id', input.customer_id)
        .eq('tenant_id', tenantId)
        .maybeSingle() as Promise<{ data: { loyalty_score: number } | null }>,
    ]);

    const { score } = await getTierScore({
      tenantId,
      customerId:    input.customer_id,
      lifetimeScore: customerRow?.loyalty_score ?? 0,
      settings: {
        tier_window_months:     settingsRow?.tier_window_months ?? null,
        tier_grandfather_until: settingsRow?.tier_grandfather_until ?? null,
      },
    });

    if (score < rewardRow.min_tier_score) {
      const required = (settingsRow?.tiers ?? [])
        .filter((t) => t.min_lifetime === rewardRow.min_tier_score)
        .map((t) => t.label)[0];
      throw new BadRequestError(
        required
          ? `Este premio es exclusivo del nivel ${required}.`
          : 'Aún no alcanzas el nivel requerido para este premio.'
      );
    }
  }

  const { data, error } = await db.rpc('rpc_redeem_reward', {
    p_tenant_id:     tenantId,
    p_customer_id:   input.customer_id,
    p_reward_id:     input.reward_id,
    p_enrollment_id: input.enrollment_id,
    p_note:          input.note ?? undefined,
  });

  if (error) {
    logger.error('rpc_redeem_reward failed', { error: error.message, tenantId });
    if (error.message.includes('P0010')) throw new NotFoundError('Inscripción');
    if (error.message.includes('P0011')) throw new NotFoundError('Recompensa');
    if (error.message.includes('P0012')) throw new BadRequestError('La recompensa ya no está disponible');
    if (error.message.includes('P0013')) throw new BadRequestError('La recompensa está agotada');
    if (error.message.includes('P0014')) {
      // Extract the balance info from the error message
      throw new BadRequestError(error.message.replace(/^.*EXCEPTION: /, ''));
    }
    throw new Error(`Error al canjear: ${error.message}`);
  }

  const redemption = data as unknown as CustomerRewardRedemption;

  // Deferred notification — fetch names and notify owner. Scheduled with
  // `after()` so the invocation is not frozen before the email goes out.
  after(async () => {
    try {
      const db2 = createServiceRoleClient();
      const [prefs, customerRes, rewardRes] = await Promise.all([
        getNotificationPrefs(tenantId),
        db2.from('customers').select('name').eq('id', input.customer_id).eq('tenant_id', tenantId).single(),
        db2.from('rewards').select('name').eq('id', input.reward_id).eq('tenant_id', tenantId).single(),
      ]);
      if (prefs?.notifyRedemption) {
        await sendRedemptionNotification(
          prefs.email,
          prefs.tenantName,
          (customerRes.data as { name: string } | null)?.name ?? 'Cliente',
          (rewardRes.data as { name: string } | null)?.name ?? 'Recompensa',
          redemption.redemption_code,
        );
      }
    } catch { /* best-effort */ }
  });

  return redemption;
}

/**
 * Marks a redemption voucher as used (staff-facing operation).
 */
export async function markRedemptionUsed(
  tenantId: UUID,
  redemptionCode: string
): Promise<CustomerRewardRedemption> {
  const db = createServiceRoleClient();

  const { data, error } = await db.rpc('rpc_mark_redemption_used', {
    p_tenant_id:       tenantId,
    p_redemption_code: redemptionCode,
  });

  if (error) {
    if (error.message.includes('P0020')) throw new NotFoundError('Código de canje');
    if (error.message.includes('P0021')) throw new BadRequestError(error.message.replace(/^.*EXCEPTION: /, ''));
    if (error.message.includes('P0022')) throw new BadRequestError('El voucher de canje ha expirado');
    throw new Error(`Error al marcar el canje: ${error.message}`);
  }

  return data as unknown as CustomerRewardRedemption;
}

/**
 * Returns paginated transaction history for a customer in a program.
 */
export async function getCustomerTransactionHistory(
  tenantId: UUID,
  customerId: UUID,
  programId: UUID | undefined,
  page = 1,
  limit = 50
): Promise<{ transactions: Transaction[]; total: number }> {
  const db = createServiceRoleClient();

  // Apply plan-based history cap for FREE plan tenants
  const planHistoryLimit = await getTransactionHistoryLimit(tenantId);
  const effectiveLimit = planHistoryLimit !== null ? Math.min(limit, planHistoryLimit) : limit;
  // For FREE plan, only the most recent N records are accessible regardless of pagination
  const effectivePage = planHistoryLimit !== null ? 1 : page;

  const from = (effectivePage - 1) * effectiveLimit;
  const to = from + effectiveLimit - 1;

  let builder = db
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (programId) {
    builder = builder.eq('program_id', programId);
  }

  const { data, error, count } = await builder;

  if (error) {
    throw new Error(`Error al listar transacciones: ${error.message}`);
  }

  return { transactions: (data ?? []) as Transaction[], total: count ?? 0 };
}

