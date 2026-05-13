/**
 * GET /api/portal?code=XXXX-XXXX[&sig=HEX&exp=UNIX]
 *
 * Customer-facing portal data endpoint. No authentication required.
 * The access code is the customer's credential.
 *
 * Optional signed URL support:
 *   If ?sig and ?exp are present the signature is verified with HMAC-SHA256.
 *   A failed signature or expired URL returns 401. If sig/exp are absent
 *   the plain code lookup is used (no expiry enforcement).
 *
 * Security guarantees:
 *   - Rate limited: 20 requests/min per tenant per IP (brute-force protection)
 *   - Only safe fields returned — no customer PII (email/phone/notes)
 *   - Tenant isolation: code only resolves within the request's tenant subdomain
 *   - Signature covers both code and expiry — tampering with exp invalidates sig
 *
 * Response shape: ApiResponse<PortalData>
 */

import { NextResponse } from 'next/server';
import { withTenantContext, type RouteContext } from '@/lib/middleware/api-context';
import { getPortalData } from '@/modules/portal';
import { verifyPortalSignature } from '@/lib/utils/crypto';
import { NotFoundError } from '@/lib/middleware/errors';
import type { ApiResponse } from '@/lib/types';
import type { PortalData } from '@/modules/portal';

export const GET = withTenantContext<PortalData>(
  async (request, _ctx: RouteContext, tenant) => {
    const url = new URL(request.url);
    const code = url.searchParams.get('code')?.toUpperCase().trim();
    const sig  = url.searchParams.get('sig')  ?? null;
    const exp  = url.searchParams.get('exp')  ?? null;

    if (!code) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'El parámetro code es requerido.' },
        { status: 400 }
      );
    }

    // ── Signature verification (optional) ────────────────────────────
    // Only enforced when both sig and exp are present in the URL.
    // Allows the business to issue time-limited QR codes for campaigns.
    if (sig !== null || exp !== null) {
      if (!sig || !exp) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Los parámetros sig y exp son requeridos para URLs firmadas.' },
          { status: 400 }
        );
      }

      const expNum = parseInt(exp, 10);
      if (isNaN(expNum)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Valor de exp inválido.' },
          { status: 400 }
        );
      }

      const secret = process.env.PORTAL_SIGNING_SECRET;
      if (!secret) {
        // Server is not configured for signed URLs — reject to avoid bypass
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Las URLs firmadas no están habilitadas en este servidor.' },
          { status: 501 }
        );
      }

      const valid = await verifyPortalSignature(code, sig, expNum, secret);
      if (!valid) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Este enlace expiró o es inválido. Solicita uno nuevo al negocio.' },
          { status: 401 }
        );
      }
    }

    // ── Data fetch ────────────────────────────────────────────────────
    const data = await getPortalData(tenant.tenantId, code);

    return NextResponse.json<ApiResponse<PortalData>>(
      { data, error: null },
      {
        status: 200,
        headers: {
          // Tell browsers and proxies never to cache customer loyalty data
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  },
  { limiter: 'accessCodeLookup', endpoint: 'GET:/api/portal' }
);
