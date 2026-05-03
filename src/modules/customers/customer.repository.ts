/**
 * Customer repository — DB layer for the customers module.
 * Every query is scoped to tenant_id. This is the first line of tenant isolation.
 * Supabase RLS policies are the second line (see supabase/migrations/002_rls_policies.sql).
 */

import { createServerClient } from '@/lib/supabase/server';
import type { Customer, UUID } from '@/lib/types';
import { NotFoundError } from '@/lib/middleware/errors';

export async function getCustomerByAccessCode(
  tenantId: UUID,
  accessCode: string
): Promise<Customer> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('access_code', accessCode)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new NotFoundError('Customer');
  }

  return data as Customer;
}

export async function getCustomerById(tenantId: UUID, customerId: UUID): Promise<Customer> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('customers')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Customer');
  }

  return data as Customer;
}

export async function listCustomers(
  tenantId: UUID,
  page = 1,
  limit = 50
): Promise<{ customers: Customer[]; total: number }> {
  const db = await createServerClient();
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await db
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to list customers: ${error.message}`);
  }

  return { customers: (data ?? []) as Customer[], total: count ?? 0 };
}
