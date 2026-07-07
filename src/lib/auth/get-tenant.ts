/**
 * Auth helper for dashboard server components and server actions.
 * Reads the authenticated Supabase user, extracts tenant_id from user_metadata,
 * and returns the full tenant record.
 *
 * Redirects to /auth/login if the user is not authenticated or has no tenant.
 */

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantByIdCached, getTenantSettingsCached } from '@/modules/tenants/tenant.repository';
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

// React.cache() dedupes calls within the same request (layout + page + actions
// all call this), and the underlying tenant/settings reads use unstable_cache
// (tag `tenant:{id}`, TTL 5 min) so repeated dashboard navigations don't hit
// the DB. Mutations invalidate via revalidateTenantCache().
export const getAuthenticatedTenant = cache(async (): Promise<AuthenticatedContext> => {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  const tenantId = user.user_metadata?.tenant_id as string | undefined;
  // Redirect to onboard if no tenant yet (OAuth or incomplete registration).
  // /auth/onboard shows the business setup form and does NOT redirect back to dashboard
  // unless the user already has a tenant_id, so there is no redirect loop.
  if (!tenantId) redirect('/auth/onboard');

  let tenant: Tenant;
  let settings: TenantSettings;

  try {
    [tenant, settings] = await Promise.all([
      getTenantByIdCached(tenantId),
      getTenantSettingsCached(tenantId),
    ]);
  } catch {
    // Tenant not found or inactive (e.g. deleted account, stale session).
    // Sign the user out silently so stale cookies don't cause a loop, then
    // redirect to login with a clear message.
    await supabase.auth.signOut();
    redirect('/auth/login?reason=account_not_found');
  }

  const effectivePlan = getEffectivePlanFromTenant(tenant!);
  const planLimits    = getPlanLimits(effectivePlan);

  return { tenantId, tenant: tenant!, settings: settings!, planLimits, effectivePlan };
});
