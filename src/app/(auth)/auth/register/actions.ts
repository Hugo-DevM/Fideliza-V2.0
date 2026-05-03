'use server';

import { onboardTenant } from '@/modules/tenants';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { BadRequestError } from '@/lib/middleware/errors';

/**
 * Called after the client successfully signs up via supabase.auth.signUp().
 * Creates the tenant row and binds the tenant_id to the new Supabase user.
 */
export async function setupTenantAction(input: {
  userId: string;
  email:  string;
  businessName: string;
  subdomain:    string;
  plan:         'free' | 'starter' | 'pro';
}): Promise<{ error?: string }> {
  try {
    // Create tenant + default settings
    const { tenant } = await onboardTenant({
      name:      input.businessName,
      subdomain: input.subdomain.toLowerCase().trim(),
      email:     input.email.toLowerCase().trim(),
      plan:      input.plan,
    });

    // Bind tenant_id into the user's JWT metadata via admin API
    const db = createServiceRoleClient();
    const { error: metaError } = await db.auth.admin.updateUserById(input.userId, {
      user_metadata: { tenant_id: tenant.id },
    });

    if (metaError) {
      return { error: `Account created but metadata binding failed: ${metaError.message}` };
    }

    return {};
  } catch (err) {
    if (err instanceof BadRequestError) return { error: err.message };
    return { error: err instanceof Error ? err.message : 'Registration failed. Please try again.' };
  }
}

/**
 * Quick subdomain availability check — called on blur from the form.
 */
export async function checkSubdomainAction(
  subdomain: string
): Promise<{ available: boolean; error?: string }> {
  const clean = subdomain.toLowerCase().trim();

  const RESERVED = new Set(['www', 'app', 'api', 'admin', 'mail', 'static', 'fideliza', 'dashboard']);
  if (RESERVED.has(clean)) return { available: false, error: 'This subdomain is reserved.' };

  if (!/^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/.test(clean)) {
    return { available: false, error: 'Only lowercase letters, numbers, and hyphens allowed (min 3 chars).' };
  }

  const db = createServiceRoleClient();
  const { data } = await db.from('tenants').select('id').eq('subdomain', clean).maybeSingle();
  return { available: !data };
}
