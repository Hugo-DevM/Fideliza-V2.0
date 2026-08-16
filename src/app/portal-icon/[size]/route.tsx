/**
 * Per-tenant home screen icon — GET /portal-icon/192 | /portal-icon/512
 *
 * Why generate instead of pointing the manifest straight at `tenants.logo_url`:
 * a tenant logo is whatever they uploaded — any dimensions, often transparent,
 * sometimes SVG. Chrome silently rejects manifest icons that are not a real
 * raster image of the declared size, and falls back to a screenshot of the page
 * or a generic globe. Rendering into an exact square PNG makes the icon valid
 * every time, whatever was uploaded.
 *
 * Free plan (no portalCustomBranding) intentionally gets neutral Fideliza
 * colours and the business initial — same rule the portal itself applies.
 *
 * The square is always filled with an opaque background. That is required for
 * iOS: Safari composites a transparent apple-touch-icon onto black, which makes
 * most uploaded logos unreadable on the home screen.
 */

import { ImageResponse } from 'next/og';
import { headers } from 'next/headers';
import { getTenantBySubdomainPublic, DEFAULT_PORTAL_COLOR } from '@/modules/portal';

export const dynamic = 'force-dynamic';

/**
 * 32  — browser tab favicon
 * 180 — iOS apple-touch-icon (Safari ignores the manifest entirely)
 * 192 / 512 — Android / desktop PWA install, declared in the manifest
 */
const ALLOWED_SIZES = new Set([32, 180, 192, 512]);

/** Fetches the logo and inlines it, so ImageResponse never fails on a bad URL. */
async function fetchLogoDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;

    const type = res.headers.get('content-type') ?? '';
    // SVG cannot be drawn by ImageResponse's <img>; fall back to the initial.
    if (!type.startsWith('image/') || type.includes('svg')) return null;

    const buf = await res.arrayBuffer();
    if (buf.byteLength > 2 * 1024 * 1024) return null; // absurdly large — skip

    return `data:${type};base64,${Buffer.from(buf).toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);
  if (!ALLOWED_SIZES.has(size)) {
    return new Response('Not found', { status: 404 });
  }

  const subdomain = (await headers()).get('x-tenant-subdomain');

  let name  = 'Fideliza';
  let color = DEFAULT_PORTAL_COLOR;
  let logo: string | null = null;

  if (subdomain) {
    try {
      const tenant = await getTenantBySubdomainPublic(subdomain);
      name = tenant.name || name;
      if (tenant.customBranding) {
        color = tenant.primary_color;
        if (tenant.logo_url) logo = await fetchLogoDataUri(tenant.logo_url);
      }
    } catch { /* unknown subdomain — neutral Fideliza icon */ }
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'F';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color,
        }}
      >
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            width={Math.round(size * 0.62)}
            height={Math.round(size * 0.62)}
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              display: 'flex',
              fontSize: Math.round(size * 0.5),
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            {initial}
          </div>
        )}
      </div>
    ),
    {
      width:  size,
      height: size,
      headers: {
        // Branding changes are rare; revalidateTenantCache already bounds the
        // upstream lookup to 5 minutes.
        'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
      },
    },
  );
}
