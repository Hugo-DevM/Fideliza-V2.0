/**
 * POST  /api/rewards/redeem — Redeem reward, issue voucher.
 * PATCH /api/rewards/redeem — Mark voucher as used (staff).
 */
import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { RedeemRewardSchema } from '@/lib/validation/reward.schema';
import { redeemReward, markRedemptionUsed } from '@/modules/transactions';
import { z } from 'zod';
import type { ApiResponse, CustomerRewardRedemption } from '@/lib/types';

export const POST = withTenantContext<CustomerRewardRedemption>(async (request, _ctx, tenant) => {
  const { body, error: bodyError } = await parseBody(request);
  if (bodyError) return bodyError;

  const parsed = RedeemRewardSchema.safeParse(body);
  const ve = zodError(parsed);
  if (ve) return ve;
  if (!parsed.success) return ve!;

  const redemption = await redeemReward(tenant.tenantId, parsed.data);
  return NextResponse.json<ApiResponse<CustomerRewardRedemption>>(
    { data: redemption, error: null }, { status: 201 }
  );
}, { limiter: 'transaction', endpoint: 'POST:/api/rewards/redeem' });

const MarkUsedSchema = z.object({
  redemption_code: z.string().min(6).max(30).toUpperCase().trim(),
});

export const PATCH = withTenantContext<CustomerRewardRedemption>(async (request, _ctx, tenant) => {
  const { body, error: bodyError } = await parseBody(request);
  if (bodyError) return bodyError;

  const parsed = MarkUsedSchema.safeParse(body);
  const ve = zodError(parsed);
  if (ve) return ve;
  if (!parsed.success) return ve!;

  const redemption = await markRedemptionUsed(tenant.tenantId, parsed.data.redemption_code);
  return NextResponse.json<ApiResponse<CustomerRewardRedemption>>(
    { data: redemption, error: null }, { status: 200 }
  );
}, { limiter: 'tenantMutation', endpoint: 'PATCH:/api/rewards/redeem' });
