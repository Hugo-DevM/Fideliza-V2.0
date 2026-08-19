import type { NextConfig } from 'next';

// ── Shared security headers (all routes) ───────────────────────────────────
//
// NOTE: Content-Security-Policy is NOT set here. It needs a per-request nonce,
// so it is built and emitted in proxy.ts. Setting it in both places would send
// two CSP headers, and the browser enforces the intersection of all of them —
// the weaker static policy would silently constrain the nonce-based one.

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

    // Old locale-prefixed routes from a previous version — locale is now
    // handled via middleware/cookie, so these paths no longer exist
    { source: '/es', destination: '/', permanent: true },
    { source: '/en', destination: '/', permanent: true },
    { source: '/es/:path*', destination: '/:path*', permanent: true },
    { source: '/en/:path*', destination: '/:path*', permanent: true },
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
