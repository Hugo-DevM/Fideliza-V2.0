'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { updateTenantSettings, softDeleteTenant } from '@/modules/tenants/tenant.repository';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function updateSettingsAction(formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();

  const primary_color   = (formData.get('primary_color')   as string | null)?.trim();
  const secondary_color = (formData.get('secondary_color') as string | null)?.trim();
  const welcome_message = (formData.get('welcome_message') as string | null)?.trim() || null;
  const program_label   = (formData.get('program_label')   as string | null)?.trim();

  // Validate hex color format
  const hexRe = /^#[0-9A-Fa-f]{6}$/;
  if (primary_color && !hexRe.test(primary_color)) {
    return { error: 'Primary color must be a valid hex code (e.g. #6366F1)' };
  }
  if (secondary_color && !hexRe.test(secondary_color)) {
    return { error: 'Secondary color must be a valid hex code' };
  }

  try {
    await updateTenantSettings(tenantId, {
      ...(primary_color   && { primary_color }),
      ...(secondary_color && { secondary_color }),
      welcome_message,
      ...(program_label   && { program_label }),
    });
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to save settings' };
  }
}

export async function deleteAccountAction(formData: FormData) {
  const { tenantId, tenant } = await getAuthenticatedTenant();

  const confirmation = (formData.get('confirmation') as string | null)?.trim();
  if (confirmation !== tenant.subdomain) {
    return { error: 'El subdominio ingresado no coincide. La cuenta no fue eliminada.' };
  }

  const reason = (formData.get('reason') as string | null)?.trim() || undefined;

  // Get the current auth user ID before signing out
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sesión no válida.' };

  try {
    // 1. Soft-delete the tenant record — data stays for developer visibility
    await softDeleteTenant(tenantId, reason);

    // 2. Delete the Supabase Auth user so the email is free to register again
    const adminClient = createServiceRoleClient();
    await adminClient.auth.admin.deleteUser(user.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.' };
  }

  redirect('/auth/login');
}
