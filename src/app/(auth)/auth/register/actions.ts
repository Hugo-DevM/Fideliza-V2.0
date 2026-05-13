'use server';

import { onboardTenant } from '@/modules/tenants';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { BadRequestError } from '@/lib/middleware/errors';
import { sendConfirmationEmail } from '@/lib/email/resend';
import { translateAuthError } from '@/lib/utils/supabase-errors';

/**
 * Creates a new auth user via admin.generateLink() (server-side) and sends
 * the confirmation email through Resend.
 *
 * Using admin.generateLink() instead of supabase.auth.signUp():
 *   - Supabase does NOT send its own email → zero duplicate emails
 *   - We control the email template completely via Resend
 *   - Returns userId so the caller can proceed to tenant setup (step 2)
 *     without needing an active session
 */
export async function signUpAndSendConfirmationAction(input: {
  email:    string;
  password: string;
  fullName: string;
}): Promise<{ userId?: string; error?: string }> {
  const db = createServiceRoleClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  const { data, error } = await db.auth.admin.generateLink({
    type:     'signup',
    email:    input.email.toLowerCase().trim(),
    password: input.password,
    options: {
      data: { full_name: input.fullName.trim() },
    },
  });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  const properties  = (data as any).properties as Record<string, string> | undefined;
  const hashedToken = properties?.hashed_token;
  const userId      = data.user?.id;

  if (!hashedToken || !userId) {
    return { error: 'No se pudo generar el enlace de confirmación. Inténtalo de nuevo.' };
  }

  // Build the confirm URL pointing to OUR callback, not Supabase's verify endpoint.
  // This avoids the implicit-flow redirect (hash tokens) and the Site URL fallback.
  // The callback calls verifyOtp({ token_hash, type: 'signup' }) and then redirects
  // to /auth/confirmed within our own app.
  const confirmUrl =
    `${appUrl}/auth/verify?token_hash=${encodeURIComponent(hashedToken)}&type=signup`;

  try {
    await sendConfirmationEmail(input.email, confirmUrl, input.fullName);
    console.info('[signup] Confirmation email sent to:', input.email);
  } catch (emailErr) {
    console.error('[signup] Failed to send confirmation email:', emailErr);
  }

  return { userId };
}

/**
 * Called after the client successfully signs up via supabase.auth.signUp().
 * Creates the tenant row and binds the tenant_id to the new Supabase user.
 */
export async function setupTenantAction(input: {
  userId: string;
  email:  string;
  businessName: string;
  subdomain:    string;
}): Promise<{ tenantId?: string; error?: string }> {
  try {
    // Always create with free plan — paid plans require Stripe checkout after account creation
    const { tenant } = await onboardTenant({
      name:      input.businessName,
      subdomain: input.subdomain.toLowerCase().trim(),
      email:     input.email.toLowerCase().trim(),
      plan:      'free',
    });

    // Bind tenant_id into the user's JWT metadata via admin API
    const db = createServiceRoleClient();
    const { error: metaError } = await db.auth.admin.updateUserById(input.userId, {
      user_metadata: { tenant_id: tenant.id },
    });

    if (metaError) {
      return { error: `Cuenta creada pero hubo un problema al guardar tus datos: ${metaError.message}` };
    }

    return { tenantId: tenant.id };
  } catch (err) {
    if (err instanceof BadRequestError) return { error: err.message };
    return { error: err instanceof Error ? err.message : 'Error al registrarse. Inténtalo de nuevo.' };
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
  if (RESERVED.has(clean)) return { available: false, error: 'Este subdominio está reservado. Elige otro.' };

  if (!/^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/.test(clean)) {
    return { available: false, error: 'Solo letras minúsculas, números y guiones (mínimo 3 caracteres).' };
  }

  const db = createServiceRoleClient();
  const { data } = await db
    .from('tenants')
    .select('id')
    .eq('subdomain', clean)
    .eq('is_active', true)
    .maybeSingle();
  return { available: !data };
}
