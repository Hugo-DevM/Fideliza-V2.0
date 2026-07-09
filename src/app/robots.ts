import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Allow all public pages
        userAgent: '*',
        allow: '/',
        // Disallow private/internal areas — intentional, not an error
        disallow: [
          '/auth/',
          '/dashboard/',
          '/api/',
          '/c/',
        ],
      },
    ],
    sitemap: 'https://fideliza.app/sitemap.xml',
  };
}
