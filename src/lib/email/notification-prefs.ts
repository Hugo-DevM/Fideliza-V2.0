/**
 * Fetches the tenant owner's email and notification preferences in one query.
 * Returns null if the tenant is not found or inactive.
 *
 * Used by service-layer hooks to decide whether to send a notification.
 * Always use the service-role client — this runs outside auth context.
 */

import { createServiceRoleClient } from '@/lib/supabase/server';
import type { UUID } from '@/lib/types';

export interface NotificationPrefs {
  email: string;
  tenantName: string;
  notifyNewCustomer: boolean;
  notifyRedemption: boolean;
  notifyWeeklyDigest: boolean;
}

export async function getNotificationPrefs(tenantId: UUID): Promise<NotificationPrefs | null> {
  const db = createServiceRoleClient();

  const { data } = await db
    .from('tenants')
    .select('email, name, tenant_settings(notify_new_customer, notify_redemption, notify_weekly_digest)')
    .eq('id', tenantId)
    .eq('is_active', true)
    .single();

  if (!data) return null;

  type Raw = {
    email: string;
    name: string;
    tenant_settings: Array<{
      notify_new_customer: boolean;
      notify_redemption: boolean;
      notify_weekly_digest: boolean;
    }> | null;
  };

  const raw = data as unknown as Raw;
  const s = Array.isArray(raw.tenant_settings) ? raw.tenant_settings[0] : raw.tenant_settings;

  return {
    email:              raw.email,
    tenantName:         raw.name,
    notifyNewCustomer:  s?.notify_new_customer  ?? true,
    notifyRedemption:   s?.notify_redemption    ?? true,
    notifyWeeklyDigest: s?.notify_weekly_digest ?? true,
  };
}
