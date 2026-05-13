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
import { getPlanLimits, getEffectivePlanFromTenant } from '@/lib/config/plans';
import type { Tenant, TenantSettings } from '@/lib/types';
import type { PlanLimits } from '@/lib/config/plans';

export interface AuthenticatedContext {
  tenantId: string;
  tenant: Tenant;
  settings: TenantSettings;
  /** The plan limits after accounting for subscription status. */
  planLimits: PlanLimits;
  /** The effective plan string (may differ from tenant.plan if subscription is past_due/canceled). */
  effectivePlan: string;
}

export async function getAuthenticatedTenant(): Promise<AuthenticatedContext> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const tenantId = user.user_metadata?.tenant_id as string | undefined;
  // Redirect to register (not login) to avoid a loop: an authenticated user
  // without a tenant_id would bounce login→dashboard→login infinitely.
  if (!tenantId) redirect('/auth/register');

  const [tenant, settings] = await Promise.all([
    getTenantById(tenantId),
    getTenantSettings(tenantId),
  ]);

  const effectivePlan = getEffectivePlanFromTenant(tenant);
  const planLimits    = getPlanLimits(effectivePlan);

  return { tenantId, tenant, settings, planLimits, effectivePlan };
}
