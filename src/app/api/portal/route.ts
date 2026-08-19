/**
 * GET /api/portal?code=XXXX-XXXX[&sig=HEX&exp=UNIX]
 *
 * Customer-facing portal data endpoint. No business session required —
 * the access code is the customer's credential (withCustomerContext).
 *
 * Signed URL support:
 *   When PORTAL_SIGNING_SECRET is configured, ?sig and ?exp are MANDATORY and
 *   verified with HMAC-SHA256. Previously they were optional, which meant an
 *   attacker could strip both params to skip verification entirely and use a
 *   code with no expiry — the signature enforced nothing. Whether signing is
 *   required is now a server-side decision the caller cannot influence.
 *
 *   With no secret configured the endpoint falls back to plain code lookup.
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
import { withCustomerContext, type RouteContext } from '@/lib/middleware/api-context';
import { getPortalData } from '@/modules/portal';
import { verifyPortalSignature } from '@/lib/utils/crypto';
import type { ApiResponse } from '@/lib/types';
import type { PortalData } from '@/modules/portal';

export const GET = withCustomerContext<PortalData>(
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

    // ── Signature verification ───────────────────────────────────────
    // Required whenever the server is configured for signed URLs. The client
    // cannot opt out by omitting the params — that was the previous bypass.
    const secret = process.env.PORTAL_SIGNING_SECRET;

    if (secret) {
      if (!sig || !exp) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Este enlace es inválido. Solicita uno nuevo al negocio.' },
          { status: 401 }
        );
      }

      const expNum = parseInt(exp, 10);
      if (isNaN(expNum)) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Valor de exp inválido.' },
          { status: 400 }
        );
      }

      const valid = await verifyPortalSignature(code, sig, expNum, secret);
      if (!valid) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Este enlace expiró o es inválido. Solicita uno nuevo al negocio.' },
          { status: 401 }
        );
      }
    } else if (sig !== null || exp !== null) {
      // Signed link presented to a server that cannot verify it — reject
      // rather than silently downgrading to plain code lookup.
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Las URLs firmadas no están habilitadas en este servidor.' },
        { status: 501 }
      );
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
