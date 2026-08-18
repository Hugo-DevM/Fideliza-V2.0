'use server';

import { redirect } from 'next/navigation';
import { after } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { sendWelcomeTenantEmail } from '@/lib/email/resend';
import { onboardTenant } from '@/modules/tenants';
import { BadRequestError } from '@/lib/middleware/errors';

export async function setupTenantFromOAuthAction(input: {
  businessName: string;
  subdomain:    string;
}): Promise<{ tenantId?: string; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { error: 'Sesión no válida. Inicia sesión de nuevo.' };
  if (user.user_metadata?.tenant_id) {
    redirect('/dashboard');
  }

  try {
    const { tenant } = await onboardTenant({
      name:      input.businessName.trim(),
      subdomain: input.subdomain.toLowerCase().trim(),
      email:     user.email!,
      plan:      'free',
    });

    const db = createServiceRoleClient();
    const { error: metaError } = await db.auth.admin.updateUserById(user.id, {
      user_metadata: { tenant_id: tenant.id },
    });

    if (metaError) {
      return { error: `Cuenta creada pero hubo un problema al guardar tus datos: ${metaError.message}` };
    }

    // El camino de correo/contraseña ya lo manda desde setupTenantAction; sin
    // esto quien entra con Google nunca recibía el correo de bienvenida.
    // emailVerified = true: el proveedor OAuth ya confirmó la dirección, así que
    // el correo omite el paso "confirma tu correo".
    after(async () => {
      await sendWelcomeTenantEmail(user.email!, input.businessName.trim(), true);
    });

    return { tenantId: tenant.id };
  } catch (err) {
    if (err instanceof BadRequestError) return { error: err.message };
    return { error: err instanceof Error ? err.message : 'Error al configurar la cuenta. Inténtalo de nuevo.' };
  }
}
