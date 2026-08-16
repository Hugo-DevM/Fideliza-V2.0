/**
 * Web app manifest — generated per tenant.
 *
 * Reading headers() makes this a request-time route rather than a build-time
 * file, which is what allows one deployment to serve a different manifest per
 * subdomain: negocio.fideliza.app installs as "Negocio", otro.fideliza.app as
 * "Otro", each with their own icon and colour.
 *
 * On the apex domain (landing, dashboard) there is no tenant subdomain, so it
 * falls back to plain Fideliza branding.
 *
 * `start_url: '/c'` combined with the remembered-card cookie means tapping the
 * installed icon lands straight on the customer's balance — no code to type.
 */

import { headers } from 'next/headers';
import type { MetadataRoute } from 'next';
import { getTenantBySubdomainPublic, DEFAULT_PORTAL_COLOR } from '@/modules/portal';
import { portalShortName } from '@/lib/portal/branding';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const subdomain = (await headers()).get('x-tenant-subdomain');

  let name  = 'Fideliza';
  let color = DEFAULT_PORTAL_COLOR;
  let isTenant = false;

  if (subdomain) {
    try {
      const tenant = await getTenantBySubdomainPublic(subdomain);
      if (tenant.clientPortal) {
        name     = tenant.name || name;
        color    = tenant.customBranding ? tenant.primary_color : DEFAULT_PORTAL_COLOR;
        isTenant = true;
      }
    } catch { /* unknown subdomain — fall through to Fideliza defaults */ }
  }

  const shortName = portalShortName(name);

  return {
    id:               isTenant ? '/c' : '/',
    name:             isTenant ? `${name} — Mi tarjeta` : 'Fideliza',
    short_name:       shortName,
    description:      isTenant
      ? `Tu tarjeta de fidelidad de ${name}. Consulta tus puntos y recompensas.`
      : 'Programas de lealtad para negocios.',
    start_url:        isTenant ? '/c' : '/',
    scope:            isTenant ? '/c' : '/',
    display:          'standalone',
    orientation:      'portrait',
    background_color: '#ffffff',
    theme_color:      color,
    icons: isTenant
      ? [
          { src: '/portal-icon/192', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/portal-icon/512', sizes: '512x512', type: 'image/png', purpose: 'any' },
        ]
      : [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
  };
}
