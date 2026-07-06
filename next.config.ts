import type { NextConfig } from 'next';

// ── Content Security Policy ─────────────────────────────────────────────────
//
// Approach: strict opt-in (deny by default, explicit allows).
// The policy differs between dashboard routes (needs Supabase realtime WS)
// and public/portal routes (no realtime needed).
//
// 'unsafe-inline' on style-src is required for Tailwind's inline styles and
// Next.js's own CSS-in-JS. Remove once CSS is fully extracted.
//
// nonce-based CSP would be stronger but requires per-request generation;
// deferred to a future enhancement when a WAF/CDN is in place.

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').replace(/\/$/, '');
const SUPABASE_WS  = SUPABASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws');

const isDev = process.env.NODE_ENV === 'development';

function buildCsp(): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src':  [
      "'self'",
      "'unsafe-inline'",
      // React dev mode uses eval() for call stack reconstruction — never present in production builds
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    'style-src':   ["'self'", "'unsafe-inline'"],   // Tailwind inline styles
    'img-src':     ["'self'", 'data:', 'blob:', 'https:'],   // HTTPS images + blob: for local previews (logo editor)
    'font-src':    ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      SUPABASE_URL,                                 // Supabase REST + auth API
      SUPABASE_WS,                                  // Supabase Realtime WebSocket
    ].filter(Boolean),
    'frame-ancestors': ["'none'"],                  // Equivalent to X-Frame-Options: DENY
    'base-uri':    ["'self'"],
    'form-action': ["'self'"],
    'object-src':  ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) =>
      values.length ? `${key} ${values.join(' ')}` : key
    )
    .join('; ');
}

// ── Shared security headers (all routes) ───────────────────────────────────

const SECURITY_HEADERS = [
  // Prevent embedding in iframes (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },

  // Prevent MIME type sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Only send origin as referrer (no full URL leak to third parties)
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Disable browser features not used by this app
  {
    key: 'Permissions-Policy',
    value: [
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'interest-cohort=()',  // Opt out of FLoC
    ].join(', '),
  },

  // HSTS: force HTTPS for 1 year, include subdomains, allow preloading
  // NOTE: Only effective once the domain is served exclusively over HTTPS.
  //       Remove includeSubDomains if non-HTTPS subdomains exist.
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },

  // Content Security Policy
  { key: 'Content-Security-Policy', value: buildCsp() },
];

// ── Additional headers for API routes ──────────────────────────────────────
// API routes must not be cached by CDNs / browsers for sensitive data.

const API_EXTRA_HEADERS = [
  { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
  { key: 'Pragma', value: 'no-cache' },
  { key: 'Expires', value: '0' },
];

// ── Config ──────────────────────────────────────────────────────────────────

const nextConfig: NextConfig = {
  redirects: async () => [
    // Legacy / mistyped URLs that Google has crawled as 404
    { source: '/policy', destination: '/privacy', permanent: true },
    { source: '/mes',    destination: '/',        permanent: true },
  ],

  headers: async () => [
    // Apply security headers to all routes
    {
      source: '/:path*',
      headers: SECURITY_HEADERS,
    },

    // Additional no-cache headers for API routes
    {
      source: '/api/:path*',
      headers: [...SECURITY_HEADERS, ...API_EXTRA_HEADERS],
    },
  ],

  // Prevent exposing the Next.js version in the X-Powered-By header
  poweredByHeader: false,

  // Strict mode catches potential issues in development
  reactStrictMode: true,
};

export default nextConfig;
