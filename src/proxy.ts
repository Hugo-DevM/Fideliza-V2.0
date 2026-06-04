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
 *
 * Runs on Edge Runtime — no Node.js APIs, no direct DB calls.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import {
  resolveTenantSubdomain,
  injectTenantHeaders,
} from '@/lib/middleware/tenant';
import { getPreferredLocale, locales, type Locale } from '@/lib/i18n';

// Paths that must never trigger a locale redirect
const NON_MARKETING_PREFIXES = ['/api', '/dashboard', '/auth', '/c', '/_next'];

function shouldRedirectForLocale(pathname: string, hasTenantSubdomain: boolean): boolean {
  if (hasTenantSubdomain) return false;
  // Root landing and legal pages are language-agnostic — no redirect needed
  if (pathname === '/' || pathname === '/privacy' || pathname === '/terms' || pathname === '/manual') return false;
  if (NON_MARKETING_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  // Already has a locale prefix — don't redirect again
  if (locales.some((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`))) return false;
  return true;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Resolve tenant subdomain ──────────────────────────────────────────
  const resolution = resolveTenantSubdomain(request);
  const hasTenantSubdomain = Boolean(resolution.subdomain);

  // ── Locale detection ─────────────────────────────────────────────────
  const locale: Locale = getPreferredLocale(
    request.headers.get('accept-language')
  );

  // Redirect bare marketing paths to their locale-prefixed versions
  if (shouldRedirectForLocale(pathname, hasTenantSubdomain)) {
    const localizedUrl = new URL(
      `/${locale}${pathname === '/' ? '' : pathname}`,
      request.url
    );
    localizedUrl.search = request.nextUrl.search;
    return NextResponse.redirect(localizedUrl, { status: 307 });
  }

  // ── Build request headers (forwarded to Server Components) ───────────
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-locale', locale);
  if (resolution.subdomain) {
    requestHeaders.set('x-tenant-subdomain', resolution.subdomain);
  }

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
    !pathname.startsWith('/auth/register/confirm') &&
    !pathname.startsWith('/auth/confirmed') &&
    !pathname.startsWith('/auth/verify');
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
