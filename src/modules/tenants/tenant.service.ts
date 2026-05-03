/**
 * Tenant service — business logic for tenant operations.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import { invalidateTenantCache } from '@/lib/middleware/api-context';
import {
  getTenantBySubdomain,
  getTenantById,
  getTenantSettings,
  updateTenant,
} from './tenant.repository';
import { BadRequestError } from '@/lib/middleware/errors';
import type { Tenant, TenantSettings, UUID } from '@/lib/types';
import type { CreateTenantInput, UpdateTenantInput } from '@/lib/validation/tenant.schema';

export async function resolveTenant(subdomain: string): Promise<Tenant> {
  return getTenantBySubdomain(subdomain);
}

export async function getTenantProfile(
  tenantId: UUID
): Promise<{ tenant: Tenant; settings: TenantSettings }> {
  const [tenant, settings] = await Promise.all([
    getTenantById(tenantId),
    getTenantSettings(tenantId),
  ]);
  return { tenant, settings };
}

export async function getTenantBySubdomainPublic(subdomain: string): Promise<{
  tenant: Tenant;
  settings: TenantSettings;
}> {
  const tenant = await getTenantBySubdomain(subdomain);
  const settings = await getTenantSettings(tenant.id);
  return { tenant, settings };
}

/**
 * Creates a new tenant and seeds their default settings.
 * Uses the service-role client to bypass RLS (this is the registration step).
 */
export async function onboardTenant(
  input: CreateTenantInput
): Promise<{ tenant: Tenant; settings: TenantSettings }> {
  const db = createServiceRoleClient();

  // Check subdomain availability
  const { data: existing } = await db
    .from('tenants')
    .select('id')
    .eq('subdomain', input.subdomain)
    .single();

  if (existing) {
    throw new BadRequestError(`Subdomain "${input.subdomain}" is already taken`);
  }

  // Check email uniqueness
  const { data: existingEmail } = await db
    .from('tenants')
    .select('id')
    .eq('email', input.email)
    .single();

  if (existingEmail) {
    throw new BadRequestError('An account with this email already exists');
  }

  // Create tenant — use the service-role client directly (no RLS, no session required)
  const { data: tenantData, error: tenantError } = await db
    .from('tenants')
    .insert({
      name:      input.name,
      subdomain: input.subdomain,
      email:     input.email,
      plan:      input.plan ?? 'free',
      logo_url:  null,
      is_active: true,
    })
    .select('*')
    .single();

  if (tenantError || !tenantData) {
    throw new Error(`Failed to create tenant: ${tenantError?.message}`);
  }

  const tenant = tenantData as unknown as Tenant;

  // Seed default settings
  const { data: settings, error: settingsError } = await db
    .from('tenant_settings')
    .insert({ tenant_id: tenant.id })
    .select('*')
    .single();

  if (settingsError || !settings) {
    throw new Error(`Failed to create tenant settings: ${settingsError?.message}`);
  }

  return { tenant, settings: settings as TenantSettings };
}

export async function modifyTenant(
  tenantId: UUID,
  input: UpdateTenantInput
): Promise<Tenant> {
  const tenant = await updateTenant(tenantId, input);
  // Invalidate subdomain → tenantId cache in case subdomain changed
  invalidateTenantCache(tenant.subdomain);
  return tenant;
}
