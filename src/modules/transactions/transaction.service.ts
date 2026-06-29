/**
 * Transaction service — business logic for earning, redeeming, and querying points.
 *
 * IMPORTANT: earn and redeem operations call Supabase RPC functions, NOT direct
 * JS sequential DB calls. This is intentional — the RPC functions run inside a
 * single PostgreSQL transaction, giving us ACID guarantees that JS sequential
 * calls cannot provide. See migration 004_rpc_functions.sql.
 */

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
import { computeTier, computeLoyaltyDelta } from '@/lib/utils/tiers';
import type { TierConfig, TenantTierSettings } from '@/lib/utils/tiers';
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
        .select('tiers_enabled, tiers, tier_score_per_stamp, tier_score_per_visit, tier_score_per_point, tier_score_per_cashback_cent')
        .eq('tenant_id', tenantId)
        .maybeSingle() as Promise<{ data: TenantTierSettings | null }>,
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
    const loyaltyScore = enrollmentRes.data?.loyalty_score ?? 0;

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

    // Flash Offer: multiply points if active window matches current time
    if (cfg.flash_enabled && isFlashOfferActive(cfg)) {
      const mult = Number(cfg.flash_multiplier ?? 2);
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

    // ── Update loyalty score + tier cache (fire-and-forget) ──────────────────
    void (async () => {
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

        const newLoyaltyScore = newScore as number;
        const tierBefore = computeTier(loyaltyScore, tierSettings.tiers);
        const tierAfter  = computeTier(newLoyaltyScore, tierSettings.tiers);

        // Update cached tier on customers table
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        void (db.from('customers') as any)
          .update({ tier_label: tierAfter?.label ?? null, tier_color: tierAfter?.color ?? null })
          .eq('id', input.customer_id)
          .eq('tenant_id', tenantId);

        // Fire tier upgrade notification if customer moved to a higher tier
        if (
          tierAfter && tierBefore &&
          tierAfter.min_lifetime > tierBefore.min_lifetime
        ) {
          const db2 = createServiceRoleClient();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: customer } = await (db2.from('customers') as any)
            .select('name, phone, whatsapp_opt_in')
            .eq('id', input.customer_id)
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
    })();
    // ────────────────────────────────────────────────────────────────────────

    // ── 80% milestone notification (fire-and-forget) ─────────────────────────
    void (async () => {
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
    })();
    // Note: tier upgrade notification is handled inside the loyalty score block above.
    // ── Surprise & Delight notification (fire-and-forget) ────────────────────
    if (surpriseFired) {
      void (async () => {
        try {
          const db2 = createServiceRoleClient();

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: customer } = await (db2.from('customers') as any)
            .select('name, phone, whatsapp_opt_in')
            .eq('id', input.customer_id)
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
      })();
    }
    // ── Referral completion hook (fire-and-forget) ───────────────────────────
    // Fires only on the referred customer's FIRST earn (lifetimePoints === 0).
    // Applies bonus to whatever program they first transact in.
    if (lifetimePoints === 0) {
      void (async () => {
        try {
          const db2 = createServiceRoleClient();

          // Atomically complete the referral: UPDATE WHERE status='pending' prevents double-fire
          const { data: referral } = await (db2 as any)
            .from('referrals')
            .update({
              status:       'completed',
              completed_at: new Date().toISOString(),
              program_id:   input.program_id,
            })
            .eq('tenant_id',   tenantId)
            .eq('referred_id', input.customer_id)
            .eq('status',      'pending')
            .is('program_id',  null)
            .select('id, referrer_id, referred_id')
            .maybeSingle() as {
              data:  { id: string; referrer_id: string; referred_id: string } | null;
              error: unknown;
            };

          if (!referral) return; // No pending referral or already completed

          // Fetch referral bonuses from tenant settings
          const { data: tsRow } = await db2
            .from('tenant_settings')
            .select('referral_program_configs')
            .eq('tenant_id', tenantId)
            .single() as { data: { referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }> } | null };

          const programConfig = tsRow?.referral_program_configs?.[input.program_id];
          const referrerBonus = programConfig?.referrer_bonus ?? 100;
          const referredBonus = programConfig?.referred_bonus ?? 50;

          // Credit referrer bonus
          if (referrerBonus > 0) {
            await (db2 as any).rpc('rpc_earn_points', {
              p_tenant_id:    tenantId,
              p_customer_id:  referral.referrer_id,
              p_program_id:   input.program_id,
              p_points_delta: referrerBonus,
              p_note:         '🎁 Bono por referido',
            });
          }

          // Credit referred bonus (on top of their normal earn)
          if (referredBonus > 0) {
            await (db2 as any).rpc('rpc_earn_points', {
              p_tenant_id:    tenantId,
              p_customer_id:  referral.referred_id,
              p_program_id:   input.program_id,
              p_points_delta: referredBonus,
              p_note:         '🎁 Bono de bienvenida por referido',
            });
          }

          // WhatsApp notification to referrer
          const { data: referrerCustomer } = await (db2.from('customers') as any)
            .select('name, phone, whatsapp_opt_in')
            .eq('id', referral.referrer_id)
            .eq('whatsapp_opt_in', true)
            .maybeSingle() as { data: { name: string; phone: string | null } | null };

          if (!referrerCustomer?.phone) return;

          const { data: referredCustomer } = await (db2.from('customers') as any)
            .select('name')
            .eq('id', referral.referred_id)
            .maybeSingle() as { data: { name: string } | null };

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
      })();
    }
    // ── Challenge progress hook (fire-and-forget) ────────────────────────────
    void (async () => {
      try {
        const db2 = createServiceRoleClient();
        const now  = new Date().toISOString();

        // Fetch active challenges for this program within their time window
        const { data: activeChallenges } = await (db2 as any)
          .from('challenges')
          .select('id, title, target, bonus_points')
          .eq('tenant_id', tenantId)
          .eq('program_id', input.program_id)
          .eq('is_active', true)
          .or(`starts_at.is.null,starts_at.lte.${now}`)
          .or(`ends_at.is.null,ends_at.gte.${now}`) as {
            data: Array<{ id: string; title: string; target: number; bonus_points: number }> | null;
          };

        if (!activeChallenges?.length) return;

        for (const challenge of activeChallenges) {
          // Fetch or create progress row
          const { data: existing } = await (db2 as any)
            .from('customer_challenge_progress')
            .select('id, progress, completed_at')
            .eq('customer_id', input.customer_id)
            .eq('challenge_id', challenge.id)
            .maybeSingle() as {
              data: { id: string; progress: number; completed_at: string | null } | null;
            };

          // Skip if already completed
          if (existing?.completed_at) continue;

          const newProgress = (existing?.progress ?? 0) + 1;

          if (existing) {
            await (db2 as any)
              .from('customer_challenge_progress')
              .update({ progress: newProgress })
              .eq('id', existing.id);
          } else {
            await (db2 as any)
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
            await (db2 as any)
              .from('customer_challenge_progress')
              .update({ completed_at: now })
              .eq('customer_id', input.customer_id)
              .eq('challenge_id', challenge.id);

            // Credit bonus points
            await (db2 as any).rpc('rpc_earn_points', {
              p_tenant_id:    tenantId,
              p_customer_id:  input.customer_id,
              p_program_id:   input.program_id,
              p_points_delta: challenge.bonus_points,
              p_note:         `Misión completada: ${challenge.title}`,
            });

            // WhatsApp notification
            const { data: customer } = await (db2 as any)
              .from('customers')
              .select('name, phone, whatsapp_opt_in')
              .eq('id', input.customer_id)
              .eq('whatsapp_opt_in', true)
              .maybeSingle() as { data: { name: string; phone: string | null } | null };

            if (customer?.phone) {
              const { data: tenantRow } = await db2
                .from('tenants')
                .select('name')
                .eq('id', tenantId)
                .single() as { data: { name: string } | null };

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
    })();
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

  // Fire-and-forget notification — fetch names and notify owner
  void (async () => {
    try {
      const db2 = createServiceRoleClient();
      const [prefs, customerRes, rewardRes] = await Promise.all([
        getNotificationPrefs(tenantId),
        db2.from('customers').select('name').eq('id', input.customer_id).single(),
        db2.from('rewards').select('name').eq('id', input.reward_id).single(),
      ]);
      if (prefs?.notifyRedemption) {
        void sendRedemptionNotification(
          prefs.email,
          prefs.tenantName,
          (customerRes.data as { name: string } | null)?.name ?? 'Cliente',
          (rewardRes.data as { name: string } | null)?.name ?? 'Recompensa',
          redemption.redemption_code,
        );
      }
    } catch { /* best-effort */ }
  })();

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

// ── Flash Offer helper ───────────────────────────────────────────────────────

/**
 * Returns true if the current Mexico City time falls within the configured
 * flash offer window. Uses a fixed UTC-6 offset (CST) — accurate within 1h
 * during CDT. Good enough for a promotional time window.
 */
function isFlashOfferActive(config: Record<string, unknown>): boolean {
  const startHour = Number(config.flash_start_hour ?? -1);
  const endHour   = Number(config.flash_end_hour   ?? -1);
  if (startHour < 0 || endHour < 0 || startHour >= endHour) return false;

  // Mexico City: UTC-6 (CST). Approximate — ignores DST.
  const nowUtc         = new Date();
  const offsetMs       = 6 * 60 * 60 * 1000;
  const mexicoNow      = new Date(nowUtc.getTime() - offsetMs);
  const mexicoHour     = mexicoNow.getUTCHours();
  const mexicoDay      = mexicoNow.getUTCDay(); // 0 = Sunday

  const days = config.flash_days as number[] | undefined;
  if (days && days.length > 0 && !days.includes(mexicoDay)) return false;

  return mexicoHour >= startHour && mexicoHour < endHour;
}
