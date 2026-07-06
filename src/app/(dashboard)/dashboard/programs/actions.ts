'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createProgram } from '@/modules/rewards';
import type { ProgramType } from '@/lib/types';

export async function createProgramAction(formData: FormData) {
  const { tenantId, planLimits } = await getAuthenticatedTenant();

  const name        = (formData.get('name')        as string).trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const type        = formData.get('type') as ProgramType;

  if (!name || !type) return { error: 'El nombre y el tipo son obligatorios.' };

  // Build config from type-specific fields
  let config: Record<string, unknown> = {};
  if (type === 'points') {
    config = {
      points_per_dollar: parseFloat(formData.get('points_per_dollar') as string) || 10,
      min_redeem:        parseInt(formData.get('min_redeem') as string, 10) || 100,
    };
  } else if (type === 'stamp') {
    config = { stamps_needed: parseInt(formData.get('stamps_needed') as string, 10) || 10 };
  } else if (type === 'visit') {
    config = { visits_needed: parseInt(formData.get('visits_needed') as string, 10) || 5 };
  } else if (type === 'cashback') {
    config = {
      cashback_percent:   parseFloat(formData.get('cashback_percent') as string) || 5,
      min_purchase_cents: Math.round((parseFloat(formData.get('min_purchase') as string) || 10) * 100),
    };
  }

  // Head Start — optional bonus on first earn (Starter+ only)
  const initialBonusRaw = parseInt(formData.get('initial_bonus') as string, 10);
  if (!isNaN(initialBonusRaw) && initialBonusRaw > 0) {
    if (!planLimits.artificialHeadStart) {
      return { error: 'El inicio con ventaja está disponible en el plan Starter o Pro.' };
    }
    config.initial_bonus = initialBonusRaw;
  }

  try {
    const program = await createProgram(tenantId, { name, description, type, config });
    revalidateTag('programs', 'max');
    revalidatePath('/dashboard/programs');
    revalidatePath('/dashboard');
    return { success: true, programId: program.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo crear el programa.' };
  }
}
