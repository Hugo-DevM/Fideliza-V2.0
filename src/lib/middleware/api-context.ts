/**
 * API request context resolution.
 *
 * Every tenant-scoped API route must call withTenantContext() to get
 * a validated TenantContext before touching any business logic.
 *
 * Flow:
 *   1. Read x-tenant-subdomain header (injected by middleware.ts)
 *   2. Look up tenant UUID in DB (with short TTL in-process cache)
 *   3. Call handler with { tenantId, subdomain }
 *   4. Apply rate limiting, logging, error handling
 *
 * Cache rationale:
 *   Subdomain → UUID lookup is the same result for the entire lifetime
 *   of a tenant. A 60-second in-process TTL eliminates ~98% of these
 *   DB round trips without risking stale data for more than 1 minute
 *   after a subdomain change (rare operation).
 *
 *   For edge deployments (multiple instances), each instance has its own
 *   cache. This is acceptable — eventual consistency for tenant lookup is fine.
 */

import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getTenantBySubdomain } from '@/modules/tenants/tenant.repository';
import { TenantNotFoundError, withErrorHandler } from '@/lib/middleware/errors';
import {
  rateLimiters,
  rateLimitExceededResponse,
  applyRateLimitHeaders,
  type RateLimitResult,
} from '@/lib/middleware/rate-limit';
import {
  generateRequestId,
  createRequestLogger,
} from '@/lib/utils/logger';
import type { TenantContext, ApiResponse } from '@/lib/types';

// ── CORS ─────────────────────────────────────────────────────────────────────
//
// Allow requests originating from any *.fideliza.app subdomain, the root
// domain itself, or no origin (server-to-server / same-origin requests).
// Rejects cross-origin requests from unrelated domains.

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'fideliza.app';
const ORIGIN_RE   = new RegExp(`^https?://(?:[^.]+\\.)?${ROOT_DOMAIN.replace('.', '\\.')}$`);

export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true; // Same-origin or server-to-server — always allow
  return ORIGIN_RE.test(origin);
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  if (!origin || !ORIGIN_RE.test(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin };
}

// ── In-process tenant cache ───────────────────────────────────────────
interface CacheEntry {
  tenantId: string;
  cachedAt: number;
}

const tenantCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60_000; // 1 minute

async function resolveTenantId(subdomain: string): Promise<string> {
  const now = Date.now();
  const cached = tenantCache.get(subdomain);

  if (cached && now - cached.cachedAt < CACHE_TTL_MS) {
    return cached.tenantId;
  }

  const tenant = await getTenantBySubdomain(subdomain);
  tenantCache.set(subdomain, { tenantId: tenant.id, cachedAt: now });
  return tenant.id;
}

// Invalidate cache entry when a tenant is updated (call from tenant service)
export function invalidateTenantCache(subdomain: string): void {
  tenantCache.delete(subdomain);
}

// ── IP extraction ─────────────────────────────────────────────────────

// Validates an IPv4 or IPv6 address string (does not resolve hostnames).
// Prevents header injection where x-forwarded-for contains arbitrary strings.
const IPV4_RE = /^(\d{1,3}\.){3}\d{1,3}$/;
const IPV6_RE = /^[0-9a-fA-F:]{2,39}$/;

function isValidIp(ip: string): boolean {
  if (IPV4_RE.test(ip)) {
    return ip.split('.').every((octet) => parseInt(octet, 10) <= 255);
  }
  return IPV6_RE.test(ip);
}

export function getClientIp(request: Request): string {
  // Vercel / Cloudflare forwards real IP in these headers.
  // Only use the first value and validate it is a well-formed IP address
  // to prevent header injection attacks.
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const candidate = forwardedFor.split(',')[0].trim();
    if (isValidIp(candidate)) return candidate;
  }

  const realIp = request.headers.get('x-real-ip')?.trim();
  if (realIp && isValidIp(realIp)) return realIp;

  return '127.0.0.1'; // local dev fallback
}

// ── Session authorization ─────────────────────────────────────────────
//
// Tenant-scoped routes are business/staff endpoints: they require a logged-in
// Supabase session whose user_metadata.tenant_id matches the tenant resolved
// from the subdomain. Without this check the subdomain alone would be enough
// to read and mutate another business's data, since the whole data layer runs
// on the service-role client and RLS never sees these queries.
//
// Customer-facing endpoints (portal, access-code lookup) deliberately have no
// session — they use withCustomerContext() instead.

type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: 401 | 403; message: string };

async function authorizeTenantSession(tenantId: string): Promise<AuthResult> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, message: 'Autenticación requerida.' };
  }

  const sessionTenantId = user.user_metadata?.tenant_id as string | undefined;

  // Compare against the tenant resolved from the host, so a valid session for
  // tenant A cannot act on tenant B by switching subdomains.
  if (!sessionTenantId || sessionTenantId !== tenantId) {
    return { ok: false, status: 403, message: 'No tienes acceso a este negocio.' };
  }

  return { ok: true, userId: user.id };
}

// ── Handler types ─────────────────────────────────────────────────────
export type RouteContext = { params: Promise<Record<string, string>> };

export type TenantHandler<T> = (
  request: Request,
  ctx: RouteContext,
  tenant: TenantContext
) => Promise<NextResponse<ApiResponse<T | null>>>;

export type PublicHandler<T> = (
  request: Request,
  ctx: RouteContext,
) => Promise<NextResponse<ApiResponse<T | null>>>;

// ── Rate limit key builders ────────────────────────────────────────────
export const rateLimitKey = {
  byTenant:      (tenantId: string, endpoint: string) => `t:${tenantId}:${endpoint}`,
  byIp:          (ip: string, endpoint: string)        => `ip:${ip}:${endpoint}`,
  byTenantAndIp: (tenantId: string, ip: string, endpoint: string) => `t:${tenantId}:ip:${ip}:${endpoint}`,
};

// ── withTenantContext ─────────────────────────────────────────────────
/**
 * Wraps a tenant-scoped API route handler. Requires an authenticated
 * business session belonging to the resolved tenant.
 *
 * - Resolves tenant from x-tenant-subdomain header (set by proxy.ts, which
 *   strips any client-supplied value first)
 * - Applies rate limiting
 * - Requires a Supabase session whose tenant_id matches the resolved tenant
 * - Logs the request with structured context
 * - Handles errors uniformly
 *
 * Usage:
 *   export const POST = withTenantContext(async (req, ctx, tenant) => {
 *     // tenant.tenantId is validated and available
 *   }, { limiter: 'tenantMutation' });
 */
export function withTenantContext<T>(
  handler: TenantHandler<T>,
  options: {
    limiter?: keyof typeof rateLimiters;
    endpoint?: string;
  } = {}
) {
  return buildTenantRoute(handler, { ...options, requireSession: true });
}

/**
 * Wraps a tenant-scoped route that is intentionally reachable without a
 * business session — the customer portal and access-code lookup.
 *
 * Identical to withTenantContext() except that no Supabase session is
 * required: the customer's access code is the credential, and the handler
 * must treat every input as untrusted. Never use this for staff/business
 * endpoints or for anything that mutates points, rewards or programs.
 */
export function withCustomerContext<T>(
  handler: TenantHandler<T>,
  options: {
    limiter?: keyof typeof rateLimiters;
    endpoint?: string;
  } = {}
) {
  return buildTenantRoute(handler, { ...options, requireSession: false });
}

function buildTenantRoute<T>(
  handler: TenantHandler<T>,
  options: {
    limiter?: keyof typeof rateLimiters;
    endpoint?: string;
    requireSession: boolean;
  }
) {
  return async (request: Request, ctx: RouteContext): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const ip = getClientIp(request);
    const url = new URL(request.url);
    const reqLogger = createRequestLogger(requestId, request.method, url.pathname, ip);

    try {
      // ── 1. Resolve tenant ──────────────────────────────────────────
      const subdomain = request.headers.get('x-tenant-subdomain');

      if (!subdomain) {
        const res = NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Tenant context required. Access this endpoint via a tenant subdomain.' },
          { status: 400 }
        );
        reqLogger.logRequest(400, { requestId });
        return res;
      }

      let tenantId: string;
      try {
        tenantId = await resolveTenantId(subdomain);
      } catch (err) {
        if (err instanceof TenantNotFoundError) {
          const res = NextResponse.json<ApiResponse<null>>(
            { data: null, error: err.message },
            { status: 404 }
          );
          reqLogger.logRequest(404, { requestId });
          return res;
        }
        throw err;
      }

      // ── 2. Rate limiting ───────────────────────────────────────────
      let rateLimitResult: RateLimitResult | null = null;
      if (options.limiter) {
        const endpoint = options.endpoint ?? url.pathname;
        const key = rateLimitKey.byTenantAndIp(tenantId, ip, endpoint);
        rateLimitResult = await rateLimiters[options.limiter](key);

        if (!rateLimitResult.allowed) {
          reqLogger.logRequest(429, { requestId, tenantId });
          return rateLimitExceededResponse(rateLimitResult);
        }
      }

      // ── 3. CORS check ──────────────────────────────────────────────
      if (!isAllowedOrigin(request)) {
        reqLogger.logRequest(403, { requestId, tenantId });
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Forbidden' },
          { status: 403 }
        );
      }

      // ── 4. Session authorization ───────────────────────────────────
      let userId: string | undefined;
      if (options.requireSession) {
        const auth = await authorizeTenantSession(tenantId);
        if (!auth.ok) {
          reqLogger.logRequest(auth.status, { requestId, tenantId });
          return NextResponse.json<ApiResponse<null>>(
            { data: null, error: auth.message },
            { status: auth.status }
          );
        }
        userId = auth.userId;
      }

      // ── 5. Call handler ────────────────────────────────────────────
      const tenant: TenantContext = { tenantId, subdomain, userId };
      const response = await handler(request, ctx, tenant);

      // Attach tracing + CORS headers
      response.headers.set('X-Request-Id', requestId);
      Object.entries(corsHeaders(request)).forEach(([k, v]) => response.headers.set(k, v));
      if (rateLimitResult) {
        applyRateLimitHeaders(response, rateLimitResult);
      }

      reqLogger.logRequest(response.status, { requestId, tenantId });
      return response;

    } catch (err) {
      // Delegate to the shared error handler
      const errHandler = withErrorHandler(async () => { throw err; });
      const errResponse = await errHandler(request, ctx);
      reqLogger.logRequest(errResponse.status, { requestId, error: String(err) });
      return errResponse;
    }
  };
}

/**
 * Wraps a public (non-tenant-scoped) API route handler.
 * Applies IP-based rate limiting and request logging only.
 */
export function withPublicContext<T>(
  handler: PublicHandler<T>,
  options: {
    limiter?: keyof typeof rateLimiters;
    endpoint?: string;
  } = {}
) {
  return async (request: Request, ctx: RouteContext): Promise<NextResponse> => {
    const requestId = generateRequestId();
    const ip = getClientIp(request);
    const url = new URL(request.url);
    const reqLogger = createRequestLogger(requestId, request.method, url.pathname, ip);

    try {
      if (options.limiter) {
        const endpoint = options.endpoint ?? url.pathname;
        const key = rateLimitKey.byIp(ip, endpoint);
        const result = await rateLimiters[options.limiter](key);

        if (!result.allowed) {
          reqLogger.logRequest(429, { requestId });
          return rateLimitExceededResponse(result);
        }
      }

      if (!isAllowedOrigin(request)) {
        reqLogger.logRequest(403, { requestId });
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: 'Forbidden' },
          { status: 403 }
        );
      }

      const response = await handler(request, ctx);
      response.headers.set('X-Request-Id', requestId);
      Object.entries(corsHeaders(request)).forEach(([k, v]) => response.headers.set(k, v));
      reqLogger.logRequest(response.status, { requestId });
      return response;

    } catch (err) {
      const errHandler = withErrorHandler(async () => { throw err; });
      const errResponse = await errHandler(request, ctx);
      reqLogger.logRequest(errResponse.status, { requestId, error: String(err) });
      return errResponse;
    }
  };
}
