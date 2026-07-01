'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';

export async function updateBonusConfigAction(formData: FormData) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();

  if (!getPlanLimits(effectivePlan).birthdayRewards) {
    return { error: 'La configuración de bonos está disponible en el plan Pro.' };
  }

  const birthday_bonus_units         = parseInt((formData.get('birthday_bonus_units')         as string) ?? '50',  10);
  const birthday_bonus_expiry_days   = parseInt((formData.get('birthday_bonus_expiry_days')   as string) ?? '30',  10);
  const reactivation_bonus_units     = parseInt((formData.get('reactivation_bonus_units')     as string) ?? '50',  10);
  const reactivation_bonus_expiry_days = parseInt((formData.get('reactivation_bonus_expiry_days') as string) ?? '30', 10);

  if (
    isNaN(birthday_bonus_units)       || birthday_bonus_units < 1       || birthday_bonus_units > 10000 ||
    isNaN(birthday_bonus_expiry_days) || birthday_bonus_expiry_days < 1 || birthday_bonus_expiry_days > 365 ||
    isNaN(reactivation_bonus_units)   || reactivation_bonus_units < 1   || reactivation_bonus_units > 10000 ||
    isNaN(reactivation_bonus_expiry_days) || reactivation_bonus_expiry_days < 1 || reactivation_bonus_expiry_days > 365
  ) {
    return { error: 'Valores inválidos. Los puntos deben estar entre 1-10,000 y la expiración entre 1-365 días.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { error } = await db
    .from('tenant_settings')
    .update({
      birthday_bonus_units,
      birthday_bonus_expiry_days,
      reactivation_bonus_units,
      reactivation_bonus_expiry_days,
    })
    .eq('tenant_id', tenantId);

  if (error) {
    return { error: 'No se pudo guardar la configuración de bonos.' };
  }

  revalidatePath('/dashboard/bonos');
  return { success: true };
}
