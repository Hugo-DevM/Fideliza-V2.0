/**
 * POST /api/tenants — Create a new tenant (business onboarding). PUBLIC.
 */
import { NextResponse } from 'next/server';
import { withPublicContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { CreateTenantSchema } from '@/lib/validation/tenant.schema';
import { onboardTenant } from '@/modules/tenants';
import type { ApiResponse, Tenant, TenantSettings } from '@/lib/types';

export const POST = withPublicContext<{ tenant: Tenant; settings: TenantSettings }>(
  async (request) => {
    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = CreateTenantSchema.safeParse(body);
    const ve = zodError(parsed);
    if (ve) return ve;
    if (!parsed.success) return ve!;

    const result = await onboardTenant(parsed.data);
    return NextResponse.json<ApiResponse<{ tenant: Tenant; settings: TenantSettings }>>(
      { data: result, error: null }, { status: 201 }
    );
  },
  { limiter: 'onboarding', endpoint: 'POST:/api/tenants' }
);
