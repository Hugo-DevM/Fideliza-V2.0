/**
 * Tenant repository — all DB interactions for the tenants module.
 * Never call this from client components. Server-only.
 */

import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { Tenant, TenantSettings, UUID } from '@/lib/types';
import { NotFoundError, TenantNotFoundError } from '@/lib/middleware/errors';

export async function getTenantBySubdomain(subdomain: string): Promise<Tenant> {
  // Use service-role client: RLS blocks anon SELECT on tenants, and this lookup
  // is called from public API routes (withTenantContext) that have no auth session.
  const db = createServiceRoleClient();

  const { data, error } = await db
    .from('tenants')
    .select('*')
    .eq('subdomain', subdomain.toLowerCase())
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new TenantNotFoundError(subdomain);
  }

  return data as Tenant;
}

export async function getTenantById(id: UUID): Promise<Tenant> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('tenants')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single();

  if (error || !data) {
    throw new NotFoundError('Negocio');
  }

  return data as Tenant;
}

export async function getTenantSettings(tenantId: UUID): Promise<TenantSettings> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('tenant_settings')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Configuración del negocio');
  }

  return data as TenantSettings;
}

export async function createTenant(
  input: Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
): Promise<Tenant> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('tenants')
    .insert(input)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al crear el negocio: ${error?.message}`);
  }

  return data as Tenant;
}

export async function updateTenantSettings(
  tenantId: UUID,
  input: {
    primary_color?: string;
    secondary_color?: string;
    welcome_message?: string | null;
    program_label?: string;
    phone_prefix?: string | null;
    timezone?: string;
    logo_padding?: number;
    currency?: string;
    notify_new_customer?: boolean;
    notify_redemption?: boolean;
    notify_weekly_digest?: boolean;
    wa_notify_welcome?: boolean;
    wa_notify_voucher_expiry?: boolean;
    wa_notify_balance_reminder?: boolean;
    wa_notify_reactivation?: boolean;
    wa_notify_streak_at_risk?: boolean;
    wa_notify_promotion?: boolean;
  }
): Promise<TenantSettings> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('tenant_settings')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('tenant_id', tenantId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al actualizar la configuración: ${error?.message}`);
  }

  return data as TenantSettings;
}

export async function updateTenant(
  id: UUID,
  input: Partial<Omit<Tenant, 'id' | 'created_at' | 'updated_at'>>
): Promise<Tenant> {
  const db = await createServerClient();

  const { data, error } = await db
    .from('tenants')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(`Error al actualizar el negocio: ${error?.message}`);
  }

  return data as Tenant;
}

/**
 * Soft-deletes a tenant: marks it inactive, records the timestamp,
 * and anonymizes the email + subdomain so both unique slots are freed
 * immediately — allowing re-registration with the same email or subdomain.
 *
 * The original values are gone from the tenants table but the row remains
 * (with deleted_at + deletion_reason) for developer audit purposes.
 */
export async function softDeleteTenant(
  id: UUID,
  reason?: string
): Promise<void> {
  // Service role bypasses RLS — needed for a privileged anonymization write
  const db = createServiceRoleClient();

  // Derive a short, stable token from the UUID (strip dashes, take 12 hex chars)
  const token = id.replace(/-/g, '').slice(0, 12);

  const { error } = await db
    .from('tenants')
    .update({
      is_active:       false,
      deleted_at:      new Date().toISOString(),
      deletion_reason: reason ?? null,
      // Free the unique slots so the same email/subdomain can be re-used
      email:     `deleted-${token}@deleted.invalid`,
      subdomain: `del-${token}`,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar el negocio: ${error.message}`);
  }
}
