'use server';

import { redeemReward } from '@/modules/transactions';

export async function redeemPortalRewardAction(
  tenantId: string,
  customerId: string,
  rewardId: string,
  enrollmentId: string,
): Promise<{ redemptionCode: string } | { error: string }> {
  try {
    const redemption = await redeemReward(tenantId, {
      customer_id:   customerId,
      reward_id:     rewardId,
      enrollment_id: enrollmentId,
      note:          null,
    });
    return { redemptionCode: redemption.redemption_code };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo canjear el premio' };
  }
}
