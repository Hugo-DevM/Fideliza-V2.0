/**
 * GET /api/customers/:code
 * Looks up a customer by their access code.
 *
 * This is the customer-facing endpoint — no auth needed.
 * The access code IS the customer's identity token.
 *
 * Requires: x-tenant-subdomain header.
 * Rate limited per tenant to prevent access code brute-forcing.
 *
 * Returns: customer + their program enrollments.
 */

import { NextResponse } from 'next/server';
import { withTenantContext, type RouteContext } from '@/lib/middleware/api-context';
import { lookupCustomerByCode } from '@/modules/customers';
import type { ApiResponse, Customer, CustomerProgramEnrollment } from '@/lib/types';

export const GET = withTenantContext<{
  customer: Customer;
  enrollments: CustomerProgramEnrollment[];
}>(
  async (_request, ctx: RouteContext, tenant) => {
    const { identifier } = await ctx.params;

    if (!identifier) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Access code is required' },
        { status: 400 }
      );
    }

    const code = identifier.toUpperCase().trim();
    const result = await lookupCustomerByCode(tenant.tenantId, code);

    return NextResponse.json<ApiResponse<{
      customer: Customer;
      enrollments: CustomerProgramEnrollment[];
    }>>(
      { data: result, error: null },
      { status: 200 }
    );
  },
  { limiter: 'accessCodeLookup', endpoint: 'GET:/api/customers/:code' }
);
