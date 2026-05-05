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
    const { data, error } = await db.rpc('rpc_earn_points', {
      p_tenant_id:    tenantId,
      p_customer_id:  input.customer_id,
      p_program_id:   input.program_id,
      p_points_delta: input.points_delta,
      p_note:         input.note ?? null,
      p_staff_id:     input.staff_id ?? null,
    });

    if (error) {
      logger.error('rpc_earn_points failed', { error: error.message, tenantId });
      // Map DB error codes to user-facing messages
      if (error.message.includes('P0002')) throw new BadRequestError('Points delta must be positive for earn transactions');
      if (error.message.includes('P0003')) throw new NotFoundError('Customer');
      if (error.message.includes('P0004')) throw new BadRequestError('Program not found or not active');
      throw new Error(`Transaction failed: ${error.message}`);
    }

    return data as unknown as Transaction;
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
    throw new NotFoundError('Enrollment — customer must be enrolled in this program first');
  }

  const newBalance = enrollment.current_points + input.points_delta;

  if (newBalance < 0) {
    throw new BadRequestError(
      `Adjustment would result in negative balance. Current: ${enrollment.current_points}, Delta: ${input.points_delta}`
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
    throw new Error(`Failed to update enrollment: ${updateErr.message}`);
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
    throw new Error(`Failed to insert transaction: ${txErr?.message}`);
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
    p_note:          input.note ?? null,
  });

  if (error) {
    logger.error('rpc_redeem_reward failed', { error: error.message, tenantId });
    if (error.message.includes('P0010')) throw new NotFoundError('Enrollment');
    if (error.message.includes('P0011')) throw new NotFoundError('Reward');
    if (error.message.includes('P0012')) throw new BadRequestError('Reward is no longer available');
    if (error.message.includes('P0013')) throw new BadRequestError('Reward is out of stock');
    if (error.message.includes('P0014')) {
      // Extract the balance info from the error message
      throw new BadRequestError(error.message.replace(/^.*EXCEPTION: /, ''));
    }
    throw new Error(`Redemption failed: ${error.message}`);
  }

  return data as unknown as CustomerRewardRedemption;
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
    if (error.message.includes('P0020')) throw new NotFoundError('Redemption code');
    if (error.message.includes('P0021')) throw new BadRequestError(error.message.replace(/^.*EXCEPTION: /, ''));
    if (error.message.includes('P0022')) throw new BadRequestError('Redemption voucher has expired');
    throw new Error(`Failed to mark redemption: ${error.message}`);
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
    throw new Error(`Failed to list transactions: ${error.message}`);
  }

  return { transactions: (data ?? []) as Transaction[], total: count ?? 0 };
}
