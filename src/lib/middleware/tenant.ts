/**
 * Tenant resolution logic.
 *
 * Resolution order:
 *  1. Subdomain of the incoming request host  →  e.g. "acme" from "acme.fideliza.app"
 *  2. x-tenant-subdomain header               →  for local dev / Postman / testing
 *
 * The resolved subdomain is forwarded as request headers so every downstream
 * handler (API routes, Server Components) can read it without re-parsing the URL.
 *
 * Header contract:
 *   x-tenant-subdomain  — the raw subdomain string
 *   x-tenant-id         — the tenant UUID (populated by DB lookup in API routes)
 *
 * NOTE: The actual DB lookup (subdomain → tenant UUID) is intentionally NOT done
 * in Next.js middleware because middleware runs on the Edge runtime which has
 * limited Node.js API support and we want to avoid a DB call on every static
 * asset request. The UUID is resolved lazily inside API route handlers via
 * getTenantFromRequest().
 */

import { NextRequest, NextResponse } from 'next/server';

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'fideliza.app';
const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'api', 'admin', 'mail', 'static']);

export interface TenantResolutionResult {
  subdomain: string | null;
  isRootDomain: boolean;
}

/**
 * Extracts the tenant subdomain from a Next.js request.
 * Returns null when the request is on the root domain (e.g. fideliza.app).
 */
export function resolveTenantSubdomain(request: NextRequest): TenantResolutionResult {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0]; // strip port for local dev

  // ── Local development override ──────────────────────────────────────────
  // Allow `x-tenant-subdomain: acme` header so devs can test without DNS setup
  const headerOverride = request.headers.get('x-tenant-subdomain');
  if (headerOverride && process.env.NODE_ENV === 'development') {
    return { subdomain: headerOverride.toLowerCase().trim(), isRootDomain: false };
  }

  // ── Localhost / preview URLs (Vercel, etc.) ─────────────────────────────
  // Pattern: <subdomain>.localhost or <subdomain>.vercel.app
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return { subdomain: null, isRootDomain: true };
  }

  // ── Production subdomain extraction ────────────────────────────────────
  // fideliza.app          → isRootDomain = true
  // acme.fideliza.app     → subdomain = "acme"
  // www.fideliza.app      → subdomain = null (reserved)
  if (hostname === ROOT_DOMAIN) {
    return { subdomain: null, isRootDomain: true };
  }

  if (hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    const subdomain = hostname.slice(0, -(ROOT_DOMAIN.length + 1)).toLowerCase();

    if (RESERVED_SUBDOMAINS.has(subdomain)) {
      return { subdomain: null, isRootDomain: false };
    }

    return { subdomain, isRootDomain: false };
  }

  // Unrecognised host — treat as root
  return { subdomain: null, isRootDomain: true };
}

/**
 * Injects resolved tenant headers into an outgoing NextResponse.
 * Called from middleware.ts for every matched request.
 */
export function injectTenantHeaders(
  response: NextResponse,
  resolution: TenantResolutionResult
): NextResponse {
  if (resolution.subdomain) {
    response.headers.set('x-tenant-subdomain', resolution.subdomain);
  }
  return response;
}

/**
 * Reads the tenant subdomain from incoming request headers.
 * Use this inside API route handlers — the value was set by middleware.
 */
export function getTenantSubdomainFromHeaders(request: NextRequest | Request): string | null {
  const headers = request instanceof NextRequest ? request.headers : new Headers(request.headers);
  return headers.get('x-tenant-subdomain');
}
