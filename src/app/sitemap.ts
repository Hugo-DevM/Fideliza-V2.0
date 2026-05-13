import type { MetadataRoute } from 'next';

const BASE = 'https://fideliza.app';
const NOW  = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Landing pages — highest priority, both languages
    {
      url:             `${BASE}/en`,
      lastModified:    NOW,
      changeFrequency: 'weekly',
      priority:        1.0,
      alternates: {
        languages: { en: `${BASE}/en`, es: `${BASE}/es` },
      },
    },
    {
      url:             `${BASE}/es`,
      lastModified:    NOW,
      changeFrequency: 'weekly',
      priority:        1.0,
      alternates: {
        languages: { en: `${BASE}/en`, es: `${BASE}/es` },
      },
    },
    // Legal pages
    {
      url:             `${BASE}/en/privacy`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.3,
    },
    {
      url:             `${BASE}/es/privacy`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.3,
    },
    {
      url:             `${BASE}/en/terms`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.3,
    },
    {
      url:             `${BASE}/es/terms`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.3,
    },
  ];
}
