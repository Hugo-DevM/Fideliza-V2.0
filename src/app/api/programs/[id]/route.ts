/**
 * GET   /api/programs/:id — Get a single program with its rewards.
 * PATCH /api/programs/:id — Update program name, status, or config.
 *
 * Status lifecycle:
 *   draft → active   (program goes live; customers can start earning)
 *   active → paused  (temporarily stops earning; existing balances preserved)
 *   active → archived (permanently closed; no new earn/redeem)
 *   paused → active  (resume)
 *   paused → archived
 *
 * Notes:
 *   - Archiving is intentionally NOT reversible from the API.
 *     An archived program's enrollments and history are preserved.
 *   - config changes on an active program take effect immediately.
 *     Communicate changes to customers before applying.
 */

import { NextResponse } from 'next/server';
import { withTenantContext, type RouteContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { UpdateRewardProgramSchema } from '@/lib/validation/reward.schema';
import { getProgramById, updateProgram, listRewardsByProgram } from '@/modules/rewards';
import { BadRequestError } from '@/lib/middleware/errors';
import type { ApiResponse, RewardProgram, Reward } from '@/lib/types';

export const GET = withTenantContext<RewardProgram & { rewards: Reward[] }>(
  async (_request, ctx: RouteContext, tenant) => {
    const { id } = await ctx.params;
    const program = await getProgramById(tenant.tenantId, id);
    const rewards = await listRewardsByProgram(tenant.tenantId, id);

    return NextResponse.json<ApiResponse<RewardProgram & { rewards: Reward[] }>>(
      { data: { ...program, rewards }, error: null },
      { status: 200 }
    );
  },
  { limiter: 'publicRead', endpoint: 'GET:/api/programs/:id' }
);

export const PATCH = withTenantContext<RewardProgram>(
  async (request, ctx: RouteContext, tenant) => {
    const { id } = await ctx.params;

    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = UpdateRewardProgramSchema.safeParse(body);
    const ve = zodError(parsed);
    if (ve) return ve;
    if (!parsed.success) return ve!;

    // Guard: prevent un-archiving via PATCH
    if (parsed.data.status) {
      const current = await getProgramById(tenant.tenantId, id);
      if (current.status === 'archived' && parsed.data.status !== 'archived') {
        throw new BadRequestError('Archived programs cannot be reactivated');
      }
    }

    const program = await updateProgram(tenant.tenantId, id, parsed.data);

    return NextResponse.json<ApiResponse<RewardProgram>>(
      { data: program, error: null },
      { status: 200 }
    );
  },
  { limiter: 'tenantMutation', endpoint: 'PATCH:/api/programs/:id' }
);
