/**
 * Customer service — business logic for customer operations.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import {
  getCustomerByAccessCode,
  getCustomerById,
  listCustomers,
} from './customer.repository';
import { BadRequestError, NotFoundError } from '@/lib/middleware/errors';
import { enforceCustomerLimit } from '@/lib/middleware/plan-limits';
import { generateAccessCode } from '@/lib/utils/crypto';
import { getNotificationPrefs } from '@/lib/email/notification-prefs';
import { sendNewCustomerNotification } from '@/lib/email/resend';
import type { Customer, CustomerProgramEnrollment, UUID } from '@/lib/types';
import type { CreateCustomerInput } from '@/lib/validation/customer.schema';

/**
 * Creates a new customer for a tenant and generates their unique access code.
 * Retries code generation on collision (astronomically unlikely but handled).
 */
export async function createCustomer(
  tenantId: UUID,
  input: CreateCustomerInput
): Promise<Customer> {
  const db = createServiceRoleClient();

  // Enforce plan customer limit before creating
  await enforceCustomerLimit(tenantId);

  // Check for duplicate phone within this tenant
  if (input.phone) {
    const { data: existing } = await db
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', input.phone)
      .single();

    if (existing) {
      throw new BadRequestError('Ya existe un cliente con este número de teléfono');
    }
  }

  // Generate a unique access code (retry up to 5 times on collision)
  let accessCode = '';
  let attempts = 0;
  while (attempts < 5) {
    accessCode = generateAccessCode();
    const { data: collision } = await db
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('access_code', accessCode)
      .single();

    if (!collision) break;
    attempts++;
  }

  if (!accessCode) {
    throw new Error('No se pudo generar un código de acceso único tras 5 intentos');
  }

  const { data, error } = await db
    .from('customers')
    .insert({
      tenant_id: tenantId,
      name: input.name,
      phone: input.phone ?? null,
      access_code: accessCode,
      notes: input.notes ?? null,
      is_active: true,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al crear el cliente: ${error?.message}`);
  }

  const customer = data as Customer;

  // Fire-and-forget notification — never block customer creation
  void getNotificationPrefs(tenantId).then((prefs) => {
    if (prefs?.notifyNewCustomer) {
      void sendNewCustomerNotification(prefs.email, prefs.tenantName, customer.name);
    }
  });

  return customer;
}

/**
 * Returns a customer by access code along with their program enrollments.
 * This is the primary customer-facing lookup (no auth required).
 */
export async function lookupCustomerByCode(
  tenantId: UUID,
  code: string
): Promise<{
  customer: Customer;
  enrollments: CustomerProgramEnrollment[];
}> {
  const db = createServiceRoleClient();
  const customer = await getCustomerByAccessCode(tenantId, code);

  const { data: enrollments } = await db
    .from('customer_program_enrollments')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('customer_id', customer.id)
    .order('last_activity_at', { ascending: false });

  return {
    customer,
    enrollments: (enrollments ?? []) as CustomerProgramEnrollment[],
  };
}

export async function getCustomerPoints(
  tenantId: UUID,
  customerId: UUID
): Promise<{
  customer: Customer;
  enrollments: (CustomerProgramEnrollment & { program_name: string; program_type: string })[];
  total_points: number;
}> {
  const db = createServiceRoleClient();
  const customer = await getCustomerById(tenantId, customerId);

  // Join enrollments with program names for a richer response
  const { data: enrollments, error } = await db
    .from('customer_program_enrollments')
    .select(`
      *,
      reward_programs!inner(name, type)
    `)
    .eq('tenant_id', tenantId)
    .eq('customer_id', customerId)
    .order('last_activity_at', { ascending: false });

  if (error) {
    throw new Error(`Error al obtener inscripciones: ${error.message}`);
  }

  const enrichedEnrollments = (enrollments ?? []).map((e: Record<string, unknown>) => ({
    ...(e as unknown as CustomerProgramEnrollment),
    program_name: (e['reward_programs'] as { name: string; type: string } | null)?.name ?? '',
    program_type: (e['reward_programs'] as { name: string; type: string } | null)?.type ?? '',
  }));

  const total_points = enrichedEnrollments.reduce(
    (sum, e) => sum + e.current_points,
    0
  );

  return { customer, enrollments: enrichedEnrollments, total_points };
}

export async function updateCustomer(
  tenantId: UUID,
  customerId: UUID,
  input: { name: string; phone?: string | null; notes?: string | null }
): Promise<Customer> {
  const db = createServiceRoleClient();

  if (input.phone) {
    const { data: existing } = await db
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('phone', input.phone)
      .neq('id', customerId)
      .single();

    if (existing) throw new BadRequestError('Ya existe un cliente con este teléfono.');
  }

  const { data, error } = await db
    .from('customers')
    .update({ name: input.name, phone: input.phone ?? null, notes: input.notes ?? null })
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Error al actualizar el cliente: ${error?.message}`);
  return data as Customer;
}

export { getCustomerById, listCustomers };
