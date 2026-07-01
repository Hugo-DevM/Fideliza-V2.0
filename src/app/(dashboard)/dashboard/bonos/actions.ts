'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits } from '@/lib/config/plans';

function parseField(formData: FormData, name: string, min: number, max: number): number | null {
  const val = parseInt((formData.get(name) as string) ?? '', 10);
  if (isNaN(val) || val < min || val > max) return null;
  return val;
}

export async function updateBonusConfigAction(formData: FormData) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();

  if (!getPlanLimits(effectivePlan).birthdayRewards) {
    return { error: 'La configuración de bonos está disponible en el plan Pro.' };
  }

  const birthday_bonus_points      = parseField(formData, 'birthday_bonus_points',      1, 10000);
  const birthday_bonus_stamps      = parseField(formData, 'birthday_bonus_stamps',      1, 50);
  const birthday_bonus_visits      = parseField(formData, 'birthday_bonus_visits',      1, 50);
  const birthday_bonus_expiry_days = parseField(formData, 'birthday_bonus_expiry_days', 1, 365);

  const reactivation_bonus_points      = parseField(formData, 'reactivation_bonus_points',      1, 10000);
  const reactivation_bonus_stamps      = parseField(formData, 'reactivation_bonus_stamps',      1, 50);
  const reactivation_bonus_visits      = parseField(formData, 'reactivation_bonus_visits',      1, 50);
  const reactivation_bonus_expiry_days = parseField(formData, 'reactivation_bonus_expiry_days', 1, 365);

  if (
    birthday_bonus_points      === null ||
    birthday_bonus_stamps      === null ||
    birthday_bonus_visits      === null ||
    birthday_bonus_expiry_days === null ||
    reactivation_bonus_points      === null ||
    reactivation_bonus_stamps      === null ||
    reactivation_bonus_visits      === null ||
    reactivation_bonus_expiry_days === null
  ) {
    return { error: 'Valores inválidos. Puntos: 1–10,000 · Sellos/Visitas: 1–50 · Vigencia: 1–365 días.' };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;
  const { error } = await db
    .from('tenant_settings')
    .update({
      birthday_bonus_points,
      birthday_bonus_stamps,
      birthday_bonus_visits,
      birthday_bonus_expiry_days,
      reactivation_bonus_points,
      reactivation_bonus_stamps,
      reactivation_bonus_visits,
      reactivation_bonus_expiry_days,
    })
    .eq('tenant_id', tenantId);

  if (error) return { error: 'No se pudo guardar la configuración de bonos.' };

  revalidatePath('/dashboard/bonos');
  return { success: true };
}
