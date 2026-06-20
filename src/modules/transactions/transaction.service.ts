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
import { sendMilestone80Message } from '@/modules/whatsapp/whatsapp.service';
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

    const { data: program } = await db
      .from('reward_programs')
      .select('config')
      .eq('id', input.program_id)
      .eq('tenant_id', tenantId)
      .single();

    const cfg = (program?.config ?? {}) as Record<string, unknown>;

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
    if (initialBonus > 0) {
      const { data: existingEnrollment } = await db
        .from('customer_program_enrollments')
        .select('lifetime_points')
        .eq('customer_id', input.customer_id)
        .eq('program_id', input.program_id)
        .maybeSingle();

      if (!existingEnrollment || (existingEnrollment as { lifetime_points: number }).lifetime_points === 0) {
        effectiveDelta += initialBonus;
        effectiveNote   = effectiveNote
          ? `${effectiveNote} · +${initialBonus} bienvenida`
          : `+${initialBonus} bienvenida`;
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
        const { data: customer } = await db2
          .from('customers')
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
