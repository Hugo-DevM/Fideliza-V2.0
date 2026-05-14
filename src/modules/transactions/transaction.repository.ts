/**
 * Transaction repository — DB layer for the transactions module.
 * Transactions are IMMUTABLE — no update/delete operations exist.
 * All queries scoped to tenant_id.
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Transaction, CustomerProgramEnrollment, CustomerRewardRedemption, UUID } from '@/lib/types';

export async function listTransactionsByCustomer(
  tenantId: UUID,
  customerId: UUID,
  page = 1,
  limit = 50
): Promise<{ transactions: Transaction[]; total: number }> {
  const db = await createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await db
    .from('transactions')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Error al listar transacciones: ${error.message}`);
  }

  return { transactions: (data ?? []) as Transaction[], total: count ?? 0 };
}

export async function createTransaction(
  input: Omit<Transaction, 'id' | 'created_at'>
): Promise<Transaction> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('transactions')
    .insert(input)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al crear la transacción: ${error?.message}`);
  }

  return data as Transaction;
}

export async function getEnrollment(
  tenantId: UUID,
  customerId: UUID,
  programId: UUID
): Promise<CustomerProgramEnrollment | null> {
  const db = await createServerClient();

  const { data } = await db
    .from('customer_program_enrollments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .eq('program_id', programId)
    .single();

  return data as CustomerProgramEnrollment | null;
}

export async function getRedemptionByCode(
  tenantId: UUID,
  code: string
): Promise<CustomerRewardRedemption | null> {
  const db = await createServerClient();

  const { data } = await db
    .from('customer_reward_redemptions')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('redemption_code', code)
    .single();

  return data as CustomerRewardRedemption | null;
}
