/**
 * Auth helper for dashboard server components and server actions.
 * Reads the authenticated Supabase user, extracts tenant_id from user_metadata,
 * and returns the full tenant record.
 *
 * Redirects to /auth/login if the user is not authenticated or has no tenant.
 */

import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantById, getTenantSettings } from '@/modules/tenants/tenant.repository';
import type { Tenant, TenantSettings } from '@/lib/types';

export interface AuthenticatedContext {
  tenantId: string;
  tenant: Tenant;
  settings: TenantSettings;
}

export async function getAuthenticatedTenant(): Promise<AuthenticatedContext> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const tenantId = user.user_metadata?.tenant_id as string | undefined;
  if (!tenantId) redirect('/auth/login');

  const [tenant, settings] = await Promise.all([
    getTenantById(tenantId),
    getTenantSettings(tenantId),
  ]);

  return { tenantId, tenant, settings };
}
