'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { updateTenantSettings, softDeleteTenant } from '@/modules/tenants/tenant.repository';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';
import { revalidateTenantCache } from '@/lib/cache/tenant-cache';

export async function updateSettingsAction(formData: FormData) {
  const { tenantId, tenant, effectivePlan } = await getAuthenticatedTenant();
  const limits = getPlanLimits(effectivePlan);

  const primary_color   = (formData.get('primary_color')   as string | null)?.trim();
  const secondary_color = (formData.get('secondary_color') as string | null)?.trim();
  const welcome_message = (formData.get('welcome_message') as string | null)?.trim() || null;
  const program_label   = (formData.get('program_label')   as string | null)?.trim();
  const phone_prefix_raw = (formData.get('phone_prefix')  as string | null)?.trim();
  const phone_prefix = phone_prefix_raw === '' ? null : (phone_prefix_raw ?? null);
  const timezone = (formData.get('timezone') as string | null)?.trim() || 'America/Mexico_City';
  const currency = (formData.get('currency') as string | null)?.trim() || 'MXN';
  const notify_new_customer  = formData.get('notify_new_customer')  === 'true';
  const notify_redemption    = formData.get('notify_redemption')    === 'true';
  const notify_weekly_digest = formData.get('notify_weekly_digest') === 'true';
  const wa_notify_welcome          = formData.get('wa_notify_welcome')          === 'true';
  const wa_notify_voucher_expiry   = formData.get('wa_notify_voucher_expiry')   === 'true';
  const wa_notify_balance_reminder = formData.get('wa_notify_balance_reminder') === 'true';
  // Plan-gated: reactivation + streak (Pro only — both are marketing templates)
  const wa_notify_reactivation   = limits.whatsappMarketing
    ? formData.get('wa_notify_reactivation')   === 'true'
    : false;
  const wa_notify_streak_at_risk = limits.whatsappMarketing
    ? formData.get('wa_notify_streak_at_risk') === 'true'
    : false;
  const wa_notify_promotion        = formData.get('wa_notify_promotion')        === 'true';
  // Plan-gated: birthday (Pro) and milestone_80 (Starter+) — force false if plan doesn't allow
  const wa_notify_birthday         = limits.birthdayRewards
    ? formData.get('wa_notify_birthday') === 'true'
    : false;
  const wa_notify_milestone_80     = limits.whatsappMonthlyLimit !== 0  // Starter+ have WhatsApp enabled
    ? formData.get('wa_notify_milestone_80') === 'true'
    : false;

  // Validate hex color format
  const hexRe = /^#[0-9A-Fa-f]{6}$/;
  if (primary_color && !hexRe.test(primary_color)) {
    return { error: 'El color primario debe ser un código hex válido (ej. #6366F1).' };
  }
  if (secondary_color && !hexRe.test(secondary_color)) {
    return { error: 'El color secundario debe ser un código hex válido.' };
  }

  // Validate phone prefix format: must be + followed by 1-4 digits
  if (phone_prefix && !/^\+[1-9]\d{0,3}$/.test(phone_prefix)) {
    return { error: 'El prefijo telefónico debe tener formato +XX (ej. +52, +54).' };
  }

  // Validate timezone is a known IANA identifier
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
  } catch {
    return { error: 'La zona horaria seleccionada no es válida.' };
  }

  try {
    await updateTenantSettings(tenantId, {
      // Plan-gated: portal branding colors (Starter+)
      ...(limits.portalCustomBranding && primary_color   && { primary_color }),
      ...(limits.portalCustomBranding && secondary_color && { secondary_color }),
      welcome_message,
      ...(program_label   && { program_label }),
      phone_prefix,
      timezone,
      currency,
      notify_new_customer,
      notify_redemption,
      notify_weekly_digest,
      wa_notify_welcome,
      wa_notify_voucher_expiry,
      wa_notify_balance_reminder,
      wa_notify_reactivation,
      wa_notify_streak_at_risk,
      wa_notify_promotion,
      wa_notify_birthday,
      wa_notify_milestone_80,
    });
    revalidateTenantCache(tenantId, tenant.subdomain);
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo guardar la configuración.' };
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
    revalidateTenantCache(tenantId, tenant.subdomain);

    // 2. Delete the Supabase Auth user so the email is free to register again
    const adminClient = createServiceRoleClient();
    await adminClient.auth.admin.deleteUser(user.id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo eliminar la cuenta.' };
  }

  redirect('/auth/login');
}
