/**
 * Customer portal layout — minimal, mobile-first shell.
 * No dashboard nav. No auth. Just the customer's loyalty card.
 *
 * Metadata is generated per request because Safari ignores the web manifest
 * entirely: on iOS the home screen icon comes from `apple-touch-icon` and the
 * label from `apple-mobile-web-app-title`, both of which live in the page HTML.
 * Without this, an iPhone would install every business's card as a generic
 * Fideliza icon while Android showed the right one.
 */

import { headers } from 'next/headers';
import type { Metadata } from 'next';
import { getTenantBySubdomainPublic } from '@/modules/portal';
import { portalShortName } from '@/lib/portal/branding';

export async function generateMetadata(): Promise<Metadata> {
  const subdomain = (await headers()).get('x-tenant-subdomain');

  let name: string | null = null;
  if (subdomain) {
    try {
      // Cached per subdomain (5 min) and already fetched by the portal page —
      // this adds no query.
      const tenant = await getTenantBySubdomainPublic(subdomain);
      if (tenant.clientPortal) name = tenant.name?.trim() || null;
    } catch { /* unknown subdomain — neutral Fideliza metadata */ }
  }

  return {
    title:       name ? `Mi tarjeta — ${name}` : 'Mi tarjeta',
    description: name
      ? `Tu tarjeta de fidelidad de ${name}. Consulta tus puntos y recompensas.`
      : 'Consulta tus puntos, recompensas y ofertas.',
    robots: { index: false, follow: false },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'default',
      // The label under the icon on an iPhone home screen.
      title: name ? portalShortName(name) : 'Mi tarjeta',
    },
    icons: {
      // Served by /portal-icon/[size], which renders the tenant logo (or their
      // initial) onto an opaque square — iOS composites transparency on black.
      apple: [{ url: '/portal-icon/180', sizes: '180x180', type: 'image/png' }],
      icon:  [{ url: '/portal-icon/32',  sizes: '32x32',   type: 'image/png' }],
    },
  };
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
