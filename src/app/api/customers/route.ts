/**
 * POST /api/customers — Create a customer. Tenant-scoped.
 * GET  /api/customers — List customers (paginated).
 */
import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { CreateCustomerSchema } from '@/lib/validation/customer.schema';
import { createCustomer, listCustomers } from '@/modules/customers';
import type { ApiResponse, Customer, PaginatedResponse } from '@/lib/types';

export const POST = withTenantContext<Customer>(async (request, _ctx, tenant) => {
  const { body, error: bodyError } = await parseBody(request);
  if (bodyError) return bodyError;

  const parsed = CreateCustomerSchema.safeParse(body);
  const ve = zodError(parsed);
  if (ve) return ve;
  if (!parsed.success) return ve!;

  const customer = await createCustomer(tenant.tenantId, parsed.data);
  return NextResponse.json<ApiResponse<Customer>>(
    { data: customer, error: null },
    { status: 201, headers: { Location: `/api/customers/${customer.access_code}` } }
  );
}, { limiter: 'tenantMutation', endpoint: 'POST:/api/customers' });

export const GET = withTenantContext<Customer[]>(async (request, _ctx, tenant) => {
  const url = new URL(request.url);
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10)));

  const { customers, total } = await listCustomers(tenant.tenantId, page, limit);
  return NextResponse.json<PaginatedResponse<Customer>>(
    { data: customers, total, page, limit, error: null }, { status: 200 }
  );
}, { limiter: 'publicRead', endpoint: 'GET:/api/customers' });
