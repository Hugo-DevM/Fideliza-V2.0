'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { updateProgram, createReward, updateReward } from '@/modules/rewards';
import { getPlanLimits } from '@/lib/config/plans';
import { markRedemptionUsed } from '@/modules/transactions';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { auditLog, AuditEvent } from '@/lib/utils/audit';
import type { ProgramStatus } from '@/lib/types';

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
  const { tenantId } = await getAuthenticatedTenant();
  try {
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

export async function verifyVoucherAction(redemptionCode: string) {
  const { tenantId } = await getAuthenticatedTenant();
  const normalizedCode = redemptionCode.toUpperCase().trim();

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

    return { error: err instanceof Error ? err.message : 'No se pudo verificar el voucher.' };
  }
}
