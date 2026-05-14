/**
 * Customer repository — DB layer for the customers module.
 * Every query is scoped to tenant_id. This is the first line of tenant isolation.
 * Supabase RLS policies are the second line (see supabase/migrations/002_rls_policies.sql).
 */

import { unstable_cache } from 'next/cache';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
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
    throw new NotFoundError('Cliente');
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
    throw new NotFoundError('Cliente');
  }

  return data as Customer;
}

export const listCustomers = unstable_cache(
  async (
    tenantId: UUID,
    page = 1,
    limit = 50,
    q?: string,
    status?: 'active' | 'inactive'
  ): Promise<{ customers: Customer[]; total: number }> => {
    const db = createServiceRoleClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = db
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (status === 'active')   query = query.eq('is_active', true);
    if (status === 'inactive') query = query.eq('is_active', false);
    if (q) {
      const term = `%${q}%`;
      query = query.or(`name.ilike.${term},phone.ilike.${term},access_code.ilike.${term}`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`Error al listar clientes: ${error.message}`);
    }

    return { customers: (data ?? []) as Customer[], total: count ?? 0 };
  },
  ['list-customers'],
  { revalidate: 15, tags: ['customers'] }
);
