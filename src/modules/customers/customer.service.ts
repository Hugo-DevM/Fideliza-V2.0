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
import { sendMilestoneNotification } from '@/lib/email/resend';
import { sendWelcomeMessage } from '@/modules/whatsapp/whatsapp.service';
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

  const optIn = input.whatsapp_opt_in ?? false;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.from('customers') as any)
    .insert({
      tenant_id: tenantId,
      name: input.name,
      phone: input.phone ?? null,
      access_code: accessCode,
      notes: input.notes ?? null,
      is_active: true,
      whatsapp_opt_in: optIn,
      whatsapp_opted_in_at: optIn ? new Date().toISOString() : null,
      birth_month: input.birth_month ?? null,
      birth_day:   input.birth_day   ?? null,
      birth_year:  input.birth_year  ?? null,
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al crear el cliente: ${error?.message}`);
  }

  const customer = data as Customer;

  // Fire-and-forget: milestone email + WhatsApp welcome (run concurrently)
  void (async () => {
    const prefs = await getNotificationPrefs(tenantId);

    // Milestone email notification (at 1, 50, 300 customers)
    void (async () => {
      const MILESTONES = [1, 50, 300];
      const { count } = await db
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId);

      const total = count ?? 0;
      if (!MILESTONES.includes(total)) return;
      if (!prefs?.notifyNewCustomer) return;
      void sendMilestoneNotification(prefs.email, prefs.tenantName, total);
    })();

    // WhatsApp welcome message
    void (async () => {
      if (!customer.whatsapp_opt_in) return;
      if (!customer.phone)           return;
      if (!prefs?.waNotifyWelcome)   return;
      await sendWelcomeMessage(
        customer.id,
        tenantId,
        customer.name,
        prefs.tenantName,
        customer.phone,
        0,
      );
    })();
  })();

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
  input: { name: string; phone?: string | null; notes?: string | null; birth_month?: number | null; birth_day?: number | null; birth_year?: number | null }
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (db.from('customers') as any)
    .update({
      name:        input.name,
      phone:       input.phone       ?? null,
      notes:       input.notes       ?? null,
      birth_month: input.birth_month ?? null,
      birth_day:   input.birth_day   ?? null,
      birth_year:  input.birth_year  ?? null,
    })
    .eq('tenant_id', tenantId)
    .eq('id', customerId)
    .select('*')
    .single();

  if (error || !data) throw new Error(`Error al actualizar el cliente: ${error?.message}`);
  return data as unknown as Customer;
}

export { getCustomerById, listCustomers };
