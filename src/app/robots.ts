import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/auth/', '/dashboard/', '/api/', '/c/'],
      },
    ],
    sitemap: 'https://fideliza.app/sitemap.xml',
  };
}
