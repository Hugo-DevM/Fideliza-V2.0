/**
 * GET  /api/programs — List all programs for the tenant (with nested rewards).
 * POST /api/programs — Create a new reward program.
 *
 * Program types and their config schemas:
 *
 *   points:   { "points_per_dollar": 10, "min_redeem": 100 }
 *   stamp:    { "stamps_needed": 10 }
 *   visit:    { "visits_needed": 5 }
 *   cashback: { "cashback_percent": 5, "min_purchase_cents": 1000 }
 *
 * A newly created program starts in 'draft' status. Activate it with
 *   PATCH /api/programs/:id  { "status": "active" }
 */

import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { CreateRewardProgramSchema } from '@/lib/validation/reward.schema';
import { listProgramsWithRewards, createProgram } from '@/modules/rewards';
import type { ApiResponse, RewardProgram, Reward } from '@/lib/types';

export const GET = withTenantContext<(RewardProgram & { rewards: Reward[] })[]>(
  async (_request, _ctx, tenant) => {
    const programs = await listProgramsWithRewards(tenant.tenantId);

    return NextResponse.json<ApiResponse<(RewardProgram & { rewards: Reward[] })[]>>(
      { data: programs, error: null },
      { status: 200 }
    );
  },
  { limiter: 'publicRead', endpoint: 'GET:/api/programs' }
);

export const POST = withTenantContext<RewardProgram>(
  async (request, _ctx, tenant) => {
    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = CreateRewardProgramSchema.safeParse(body);
    const ve = zodError(parsed);
    if (ve) return ve;
    if (!parsed.success) return ve!;

    const program = await createProgram(tenant.tenantId, parsed.data);

    return NextResponse.json<ApiResponse<RewardProgram>>(
      { data: program, error: null },
      { status: 201 }
    );
  },
  { limiter: 'tenantMutation', endpoint: 'POST:/api/programs' }
);
