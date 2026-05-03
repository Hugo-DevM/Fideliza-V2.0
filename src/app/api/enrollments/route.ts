/**
 * GET  /api/enrollments?customer_id=UUID[&program_id=UUID] — List enrollments.
 * POST /api/enrollments — Explicitly enroll a customer in a program.
 *
 * Enrollments are also created implicitly when the first earn transaction is
 * posted (via the DB trigger trg_auto_enroll_customer + the RPC upsert).
 * This endpoint is for cases where you want to pre-enroll customers at
 * signup or import time, before any transaction is recorded.
 *
 * POST is idempotent — enrolling a customer who is already enrolled returns
 * the existing enrollment row with HTTP 200 instead of 201.
 */

import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import {
  EnrollCustomerSchema,
  ListEnrollmentsQuerySchema,
} from '@/lib/validation/reward.schema';
import { enrollCustomer, listEnrollments } from '@/modules/rewards';
import type { ApiResponse, CustomerProgramEnrollment, PaginatedResponse } from '@/lib/types';

export const GET = withTenantContext<CustomerProgramEnrollment[]>(
  async (request, _ctx, tenant) => {
    const url = new URL(request.url);

    const queryParsed = ListEnrollmentsQuerySchema.safeParse({
      customer_id: url.searchParams.get('customer_id') ?? undefined,
      program_id:  url.searchParams.get('program_id')  ?? undefined,
      page:        url.searchParams.get('page')  ?? 1,
      limit:       url.searchParams.get('limit') ?? 50,
    });
    const ve = zodError(queryParsed);
    if (ve) return ve;
    if (!queryParsed.success) return ve!;

    const { enrollments, total } = await listEnrollments(
      tenant.tenantId,
      queryParsed.data.customer_id,
      queryParsed.data.program_id,
      queryParsed.data.page,
      queryParsed.data.limit
    );

    return NextResponse.json<PaginatedResponse<CustomerProgramEnrollment>>(
      {
        data:  enrollments,
        total,
        page:  queryParsed.data.page,
        limit: queryParsed.data.limit,
        error: null,
      },
      { status: 200 }
    );
  },
  { limiter: 'publicRead', endpoint: 'GET:/api/enrollments' }
);

export const POST = withTenantContext<CustomerProgramEnrollment>(
  async (request, _ctx, tenant) => {
    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = EnrollCustomerSchema.safeParse(body);
    const ve = zodError(parsed);
    if (ve) return ve;
    if (!parsed.success) return ve!;

    const enrollment = await enrollCustomer(
      tenant.tenantId,
      parsed.data.customer_id,
      parsed.data.program_id
    );

    return NextResponse.json<ApiResponse<CustomerProgramEnrollment>>(
      { data: enrollment, error: null },
      // 201 on fresh enrollment, but we can't easily distinguish upsert vs
      // existing here — 200 is safe and honest for an idempotent endpoint
      { status: 200 }
    );
  },
  { limiter: 'tenantMutation', endpoint: 'POST:/api/enrollments' }
);
