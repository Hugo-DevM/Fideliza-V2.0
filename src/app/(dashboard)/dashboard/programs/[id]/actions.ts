'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { updateProgram, createReward, updateReward } from '@/modules/rewards';
import { markRedemptionUsed } from '@/modules/transactions';
import { auditLog, AuditEvent } from '@/lib/utils/audit';
import type { ProgramStatus } from '@/lib/types';

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

    revalidatePath(`/dashboard/programs/${programId}`);
    revalidatePath('/dashboard/programs');
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function createRewardAction(programId: string, formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();

  const name        = (formData.get('name') as string).trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const cost_points = parseInt(formData.get('cost_points') as string, 10);
  const stock_str   = formData.get('stock') as string;
  const stock       = stock_str ? parseInt(stock_str, 10) : null;
  const expiry_days_str = formData.get('expiry_days') as string;
  const expiry_days = expiry_days_str ? parseInt(expiry_days_str, 10) : null;

  if (!name || isNaN(cost_points) || cost_points <= 0) {
    return { error: 'Name and valid cost are required' };
  }

  try {
    await createReward(tenantId, { program_id: programId, name, description, cost_points, stock, expiry_days });
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to create reward' };
  }
}

export async function toggleRewardAction(programId: string, rewardId: string, isActive: boolean) {
  const { tenantId } = await getAuthenticatedTenant();
  try {
    await updateReward(tenantId, rewardId, { is_active: isActive });
    revalidatePath(`/dashboard/programs/${programId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed' };
  }
}

export async function verifyVoucherAction(redemptionCode: string) {
  const { tenantId } = await getAuthenticatedTenant();
  const normalizedCode = redemptionCode.toUpperCase().trim();

  try {
    const redemption = await markRedemptionUsed(tenantId, normalizedCode);

    await auditLog({
      tenantId,
      eventType: AuditEvent.REWARD_VERIFIED,
      resourceType: 'redemption',
      resourceId: redemption.id,
      metadata: { redemption_code: normalizedCode },
    });

    revalidatePath('/dashboard');
    return { success: true, redemption };
  } catch (err) {
    await auditLog({
      tenantId,
      eventType: AuditEvent.REWARD_VERIFICATION_FAILED,
      resourceType: 'redemption',
      metadata: { redemption_code: normalizedCode, error: err instanceof Error ? err.message : String(err) },
    });

    return { error: err instanceof Error ? err.message : 'Failed to verify voucher' };
  }
}
