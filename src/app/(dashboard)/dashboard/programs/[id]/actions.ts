'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { updateProgram, createReward, updateReward } from '@/modules/rewards';
import { getPlanLimits } from '@/lib/config/plans';
import { markRedemptionUsed } from '@/modules/transactions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog, AuditEvent } from '@/lib/utils/audit';
import type { ProgramStatus } from '@/lib/types';

export async function updateFlashOfferAction(
  programId: string,
  flash: {
    flash_enabled:    boolean;
    flash_multiplier: number;
    flash_start_hour: number;
    flash_end_hour:   number;
    flash_days:       number[];
  },
) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  if (!getPlanLimits(effectivePlan).flashOffers) return { error: 'Flash Offers requiere plan Starter o Pro.' };

  const db = createServiceRoleClient();

  // Merge flash fields into existing config (preserve other config keys)
  const { data: program } = await db
    .from('reward_programs')
    .select('config')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .single();

  if (!program) return { error: 'Programa no encontrado.' };

  const newConfig = { ...(program.config as Record<string, unknown>), ...flash };

  try {
    await updateProgram(tenantId, programId, { config: newConfig });
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo guardar el Flash Offer.' };
  }
}

export async function updateTiersAction(
  programId: string,
  tiers: { tiers_enabled: boolean; tiers: unknown[] },
) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  if (!getPlanLimits(effectivePlan).universalTiers) {
    return { error: 'Niveles VIP requiere el plan Pro.' };
  }

  const db = createServiceRoleClient();

  const { data: program } = await db
    .from('reward_programs')
    .select('config')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .single();

  if (!program) return { error: 'Programa no encontrado.' };

  const newConfig = { ...(program.config as Record<string, unknown>), ...tiers };

  try {
    await updateProgram(tenantId, programId, { config: newConfig });
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo guardar los Tiers.' };
  }
}

export async function updateSurpriseDelightAction(
  programId: string,
  surprise: {
    surprise_enabled:     boolean;
    surprise_probability: number;
    surprise_multiplier:  number;
  },
) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  if (!getPlanLimits(effectivePlan).surpriseDelight) {
    return { error: 'Surprise & Delight requiere el plan Pro.' };
  }

  const db = createServiceRoleClient();

  const { data: program } = await db
    .from('reward_programs')
    .select('config')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .single();

  if (!program) return { error: 'Programa no encontrado.' };

  const newConfig = { ...(program.config as Record<string, unknown>), ...surprise };

  try {
    await updateProgram(tenantId, programId, { config: newConfig });
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo guardar Surprise & Delight.' };
  }
}

export async function updateReferralAction(
  programId: string,
  referral: {
    referral_enabled: boolean;
    referrer_bonus:   number;
    referred_bonus:   number;
  },
) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  if (!getPlanLimits(effectivePlan).referralProgram) {
    return { error: 'El programa de referidos requiere el plan Pro.' };
  }

  const db = createServiceRoleClient();

  const { data: program } = await db
    .from('reward_programs')
    .select('config')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .single();

  if (!program) return { error: 'Programa no encontrado.' };

  const newConfig = { ...(program.config as Record<string, unknown>), ...referral };

  try {
    await updateProgram(tenantId, programId, { config: newConfig });
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo guardar el programa de referidos.' };
  }
}

export async function createChallengeAction(
  programId: string,
  input: {
    title:        string;
    description?: string | null;
    target:       number;
    bonus_points: number;
    ends_at:      string | null;
  },
) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  if (!getPlanLimits(effectivePlan).challenges) {
    return { error: 'Las misiones requieren el plan Pro.' };
  }
  if (!input.title.trim() || input.target < 1 || input.bonus_points < 1) {
    return { error: 'Datos inválidos.' };
  }

  const db = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (db as any).from('challenges').insert({
    tenant_id:    tenantId,
    program_id:   programId,
    title:        input.title.trim(),
    description:  input.description?.trim() || null,
    target:       input.target,
    bonus_points: input.bonus_points,
    ends_at:      input.ends_at || null,
    is_active:    true,
  });

  if (error) return { error: 'No se pudo crear la misión.' };

  revalidatePath(`/dashboard/programs/${programId}`);
  return { success: true };
}

export async function deleteChallengeAction(programId: string, challengeId: string) {
  const { tenantId } = await getAuthenticatedTenant();
  const db = createServiceRoleClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any)
    .from('challenges')
    .update({ is_active: false })
    .eq('id', challengeId)
    .eq('tenant_id', tenantId);

  revalidatePath(`/dashboard/programs/${programId}`);
  return { success: true };
}

export async function updateProgramInfoAction(programId: string, formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();
  const name        = (formData.get('name') as string).trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  if (!name) return { error: 'El nombre es obligatorio.' };
  try {
    await updateProgram(tenantId, programId, { name, description });
    revalidateTag('programs', 'max');
    revalidatePath(`/dashboard/programs/${programId}`);
    revalidatePath('/dashboard/programs');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar el programa.' };
  }
}

export async function updateProgramStatusAction(programId: string, status: ProgramStatus) {
  const { tenantId } = await getAuthenticatedTenant();
  try {
    await updateProgram(tenantId, programId, { status });

    await auditLog({
      tenantId,
      eventType: status === 'archived' ? AuditEvent.PROGRAM_ARCHIVED : AuditEvent.PROGRAM_STATUS_CHANGED,
      resourceType: 'program',
      resourceId: programId,
      metadata: { status },
    });

    revalidateTag('programs', 'max');
    revalidatePath(`/dashboard/programs/${programId}`);
    revalidatePath('/dashboard/programs');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar el programa.' };
  }
}

export async function createRewardAction(programId: string, formData: FormData) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();

  const name        = (formData.get('name') as string).trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const cost_points = parseInt(formData.get('cost_points') as string, 10);
  const stock_str   = formData.get('stock') as string;
  const stock       = stock_str ? parseInt(stock_str, 10) : null;
  const expiry_days_str = formData.get('expiry_days') as string;
  const expiry_days = expiry_days_str ? parseInt(expiry_days_str, 10) : null;

  if (!name || isNaN(cost_points) || cost_points <= 0) {
    return { error: 'El nombre y un costo válido son obligatorios.' };
  }

  try {
    const db = createServiceRoleClient();
    const limits = getPlanLimits(effectivePlan);
    if (limits.maxRewardsPerProgram !== null) {
      const { count } = await db
        .from('rewards')
        .select('id', { count: 'exact', head: true })
        .eq('program_id', programId)
        .eq('tenant_id', tenantId)
        .eq('is_active', true);
      if ((count ?? 0) >= limits.maxRewardsPerProgram) {
        return { error: `Límite alcanzado: máximo ${limits.maxRewardsPerProgram} recompensas activas por programa.` };
      }
    }

    await createReward(tenantId, { program_id: programId, name, description, cost_points, stock, expiry_days });
    revalidateTag('rewards', 'max');
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo crear el premio.' };
  }
}

export async function toggleRewardAction(programId: string, rewardId: string, isActive: boolean) {
  const { tenantId, effectivePlan } = await getAuthenticatedTenant();
  try {
    // Re-activating a reward must respect the same plan rules as creating one
    if (isActive) {
      const limits = getPlanLimits(effectivePlan);
      if (!limits.rewardCatalog) {
        return { error: 'El catálogo de recompensas no está disponible en tu plan.' };
      }
      if (limits.maxRewardsPerProgram !== null) {
        const db = createServiceRoleClient();
        const { count } = await db
          .from('rewards')
          .select('id', { count: 'exact', head: true })
          .eq('program_id', programId)
          .eq('tenant_id', tenantId)
          .eq('is_active', true);
        if ((count ?? 0) >= limits.maxRewardsPerProgram) {
          return { error: `Límite alcanzado: máximo ${limits.maxRewardsPerProgram} recompensas activas por programa.` };
        }
      }
    }

    await updateReward(tenantId, rewardId, { is_active: isActive });
    revalidateTag('rewards', 'max');
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar el premio.' };
  }
}

export async function deleteRewardAction(programId: string, rewardId: string) {
  const { tenantId } = await getAuthenticatedTenant();
  try {
    // Soft delete — keeps referential integrity with redemption history
    await updateReward(tenantId, rewardId, { is_active: false });
    revalidateTag('rewards', 'max');
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar la recompensa.' };
  }
}

function translateVoucherError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('not found') || m.includes('no encontrado') || m.includes('código de canje'))
    return 'Código no encontrado. Verifica que esté bien escrito.';
  if (m.includes('already used') || m.includes('ya usado') || m.includes('already been used'))
    return 'Este voucher ya fue canjeado anteriormente.';
  if (m.includes('expired') || m.includes('expirado'))
    return 'Este voucher ha expirado y ya no es válido.';
  if (m.includes('cancelled') || m.includes('cancelado'))
    return 'Este voucher fue cancelado.';
  if (m.includes('tenant') || m.includes('permission'))
    return 'No tienes permiso para canjear este voucher.';
  return 'No se pudo verificar el voucher. Intenta de nuevo.';
}

export async function verifyVoucherAction(redemptionCode: string) {
  const { tenantId } = await getAuthenticatedTenant();
  // Normalize: strip hyphens, uppercase, then reformat as XXXX-XXXXXX (DB format)
  const raw = redemptionCode.toUpperCase().trim().replace(/-/g, '');
  const normalizedCode = raw.length > 4 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : raw;

  try {
    const redemption = await markRedemptionUsed(tenantId, normalizedCode);

    // Fetch customer name and reward name for the confirmation modal
    const db = createServiceRoleClient();
    const [{ data: customer }, { data: reward }] = await Promise.all([
      db.from('customers').select('name').eq('id', redemption.customer_id).single(),
      db.from('rewards').select('name, description').eq('id', redemption.reward_id).single(),
    ]);

    await auditLog({
      tenantId,
      eventType: AuditEvent.REWARD_VERIFIED,
      resourceType: 'redemption',
      resourceId: redemption.id,
      metadata: { redemption_code: normalizedCode },
    });

    revalidatePath('/dashboard');
    return {
      success: true,
      redemptionCode: normalizedCode,
      customerName:   (customer as { name: string } | null)?.name ?? null,
      rewardName:     (reward as { name: string; description: string | null } | null)?.name ?? null,
      rewardDesc:     (reward as { name: string; description: string | null } | null)?.description ?? null,
      usedAt:         redemption.used_at ?? new Date().toISOString(),
    };
  } catch (err) {
    await auditLog({
      tenantId,
      eventType: AuditEvent.REWARD_VERIFICATION_FAILED,
      resourceType: 'redemption',
      metadata: { redemption_code: normalizedCode, error: err instanceof Error ? err.message : String(err) },
    });

    const msg = err instanceof Error ? err.message : '';
    const translated = translateVoucherError(msg);
    return { error: translated };
  }
}
