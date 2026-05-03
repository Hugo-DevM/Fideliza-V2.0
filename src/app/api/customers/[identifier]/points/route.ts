/**
 * GET /api/customers/:id/points
 * Returns a customer's point balances across all programs.
 *
 * Used by the business dashboard to view a specific customer's loyalty status.
 * Requires: x-tenant-subdomain header.
 *
 * The :id path param here is the customer's UUID (not access code).
 * For access-code lookup, use GET /api/customers/:code.
 */

import { NextResponse } from 'next/server';
import { withTenantContext, type RouteContext } from '@/lib/middleware/api-context';
import { getCustomerPoints } from '@/modules/customers';
import { BadRequestError } from '@/lib/middleware/errors';
import type { ApiResponse, Customer, CustomerProgramEnrollment } from '@/lib/types';

export const GET = withTenantContext<{
  customer: Customer;
  enrollments: (CustomerProgramEnrollment & { program_name: string; program_type: string })[];
  total_points: number;
}>(
  async (_request, ctx: RouteContext, tenant) => {
    const { identifier: customerId } = await ctx.params;

    // Validate it looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(customerId)) {
      throw new BadRequestError('Customer ID must be a valid UUID. For access code lookup use GET /api/customers/:code');
    }

    const result = await getCustomerPoints(tenant.tenantId, customerId);

    return NextResponse.json<ApiResponse<typeof result>>(
      { data: result, error: null },
      { status: 200 }
    );
  },
  { limiter: 'publicRead', endpoint: 'GET:/api/customers/:id/points' }
);
