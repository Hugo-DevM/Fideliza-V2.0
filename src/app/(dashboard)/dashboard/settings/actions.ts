'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { updateTenantSettings } from '@/modules/tenants/tenant.repository';

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
