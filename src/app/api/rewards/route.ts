/**
 * GET  /api/rewards — List rewards for current tenant (public).
 * POST /api/rewards — Create a reward (authenticated).
 */
import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { ListRewardsQuerySchema, CreateRewardSchema } from '@/lib/validation/reward.schema';
import { listRewards, createReward } from '@/modules/rewards';
import type { ApiResponse, Reward, PaginatedResponse } from '@/lib/types';

export const GET = withTenantContext<Reward[]>(async (request, _ctx, tenant) => {
  const url = new URL(request.url);
  const queryParsed = ListRewardsQuerySchema.safeParse({
    program_id: url.searchParams.get('program_id') ?? undefined,
    page:       url.searchParams.get('page')  ?? 1,
    limit:      url.searchParams.get('limit') ?? 50,
  });
  const ve = zodError(queryParsed);
  if (ve) return ve;
  if (!queryParsed.success) return ve!;

  const { rewards, total } = await listRewards(tenant.tenantId, queryParsed.data);
  return NextResponse.json<PaginatedResponse<Reward>>(
    { data: rewards, total, page: queryParsed.data.page, limit: queryParsed.data.limit, error: null },
    { status: 200 }
  );
}, { limiter: 'publicRead', endpoint: 'GET:/api/rewards' });

export const POST = withTenantContext<Reward>(async (request, _ctx, tenant) => {
  const { body, error: bodyError } = await parseBody(request);
  if (bodyError) return bodyError;

  const parsed = CreateRewardSchema.safeParse(body);
  const ve = zodError(parsed);
  if (ve) return ve;
  if (!parsed.success) return ve!;

  const reward = await createReward(tenant.tenantId, parsed.data);
  return NextResponse.json<ApiResponse<Reward>>(
    { data: reward, error: null }, { status: 201 }
  );
}, { limiter: 'tenantMutation', endpoint: 'POST:/api/rewards' });
