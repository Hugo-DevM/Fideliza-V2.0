/**
 * GET /api/tenants/:subdomain
 * Returns tenant public profile + settings.
 *
 * Used by the customer-facing app to load branding before rendering.
 * PUBLIC — no auth required.
 */

import { NextResponse } from 'next/server';
import { withPublicContext, type RouteContext } from '@/lib/middleware/api-context';
import { getTenantBySubdomainPublic } from '@/modules/tenants';
import type { ApiResponse, Tenant, TenantSettings } from '@/lib/types';

// Public tenant shape — email is never exposed to the outside world
export type PublicTenant = Omit<Tenant, 'email'>;

export const GET = withPublicContext<{ tenant: PublicTenant; settings: TenantSettings }>(
  async (_request, ctx: RouteContext) => {
    const { subdomain } = await ctx.params;

    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'El subdominio es requerido' },
        { status: 400 }
      );
    }

    const result = await getTenantBySubdomainPublic(subdomain.toLowerCase());

    // Strip sensitive fields before returning to the public
    const publicTenant: PublicTenant & { email?: string } = { ...result.tenant };
    delete publicTenant.email;

    return NextResponse.json<ApiResponse<{ tenant: PublicTenant; settings: TenantSettings }>>(
      { data: { tenant: publicTenant, settings: result.settings }, error: null },
      { status: 200 }
    );
  },
  { limiter: 'publicRead', endpoint: 'GET:/api/tenants/:subdomain' }
);
