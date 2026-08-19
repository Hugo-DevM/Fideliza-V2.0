/**
 * Next.js 16 Proxy (formerly middleware) — runs before every matched request.
 *
 * Responsibilities:
 *  1. Resolve tenant subdomain from the request host
 *  2. Inject x-tenant-subdomain header for downstream handlers
 *  3. Detect preferred locale (Accept-Language) and redirect root-domain
 *     marketing paths to their locale-prefixed equivalents (/en or /es)
 *  4. Inject x-locale header so the root layout can set <html lang>
 *  5. Refresh Supabase auth session (prevents stale JWTs)
 *  6. Redirect unauthenticated users away from protected dashboard routes
 *  7. Generate a per-request CSP nonce and emit the Content-Security-Policy
 *
 * Runs on Edge Runtime — no Node.js APIs, no direct DB calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  resolveTenantSubdomain,
  injectTenantHeaders,
} from '@/lib/middleware/tenant';
import { getPreferredLocale, type Locale } from '@/lib/i18n';

// ── Content Security Policy ──────────────────────────────────────────────
//
// Built here rather than in next.config.ts because a nonce has to be minted
// per request. script-src previously carried 'unsafe-inline', which let any
// injected inline script execute and made the CSP close to decorative against
// XSS. With a nonce + 'strict-dynamic', only scripts we emit run, and scripts
// they load in turn inherit that trust.
//
// style-src deliberately keeps 'unsafe-inline': React writes style="" attributes
// throughout the UI and CSP has no nonce mechanism for inline style attributes,
// so removing it would break rendering for no meaningful XSS gain.

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_WS  = SUPABASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');

function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === 'development';

  return [
    `default-src 'self'`,
    // React dev mode uses eval() for call stack reconstruction — never in production
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src ${["'self'", SUPABASE_URL, SUPABASE_WS].filter(Boolean).join(' ')}`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `upgrade-insecure-requests`,
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // btoa/crypto are available on the Edge runtime; Buffer is not.
  const nonce = btoa(crypto.randomUUID());
  const csp   = buildCsp(nonce);

  // ── Resolve tenant subdomain ──────────────────────────────────────────
  const resolution = resolveTenantSubdomain(request);

  // ── Locale detection ─────────────────────────────────────────────────
  const locale: Locale = getPreferredLocale(
    request.headers.get('accept-language')
  );

  // ── Build request headers (forwarded to Server Components) ───────────
  const requestHeaders = new Headers(request.headers);

  // Strip any client-supplied tenant header before deriving our own. Without
  // this, a request to the root domain (where resolution.subdomain is null and
  // the header below is never set) would pass an attacker-controlled
  // x-tenant-subdomain straight through to the route handlers, which trust it
  // as the tenant identity.
  requestHeaders.delete('x-tenant-subdomain');

  requestHeaders.set('x-locale', locale);
  if (resolution.subdomain) {
    requestHeaders.set('x-tenant-subdomain', resolution.subdomain);
  }

  // Next.js parses the CSP from the request header to nonce its own script
  // tags; x-nonce is what our own inline scripts read via headers().
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', csp);

  // ── Build mutable response ───────────────────────────────────────────
  let response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Inject resolved tenant subdomain into response headers
  response = injectTenantHeaders(response, resolution);
  response.headers.set('x-locale', locale);
  if (resolution.subdomain) {
    response.headers.set('x-tenant-subdomain', resolution.subdomain);
  }

  // ── Refresh Supabase session ──────────────────────────────────────────
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: requestHeaders } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // ── Auth guard for business dashboard routes ──────────────────────────
  const isDashboardRoute = pathname.startsWith('/dashboard');
  if (isDashboardRoute && !user) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/register
  const isAuthRoute = pathname.startsWith('/auth') &&
    !pathname.startsWith('/auth/callback') &&
    !pathname.startsWith('/auth/onboard') &&
    !pathname.startsWith('/auth/register/confirm') &&
    !pathname.startsWith('/auth/confirmed') &&
    !pathname.startsWith('/auth/verify');
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Applied last on purpose: the Supabase cookie setAll() callback above
  // rebuilds `response`, which discards any header set before it.
  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('x-locale', locale);
  if (resolution.subdomain) {
    response.headers.set('x-tenant-subdomain', resolution.subdomain);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
