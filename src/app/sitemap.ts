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
    // Legal & docs — standalone pages with client-side language toggle
    {
      url:             `${BASE}/privacy`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.3,
    },
    {
      url:             `${BASE}/terms`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.3,
    },
    {
      url:             `${BASE}/manual`,
      lastModified:    NOW,
      changeFrequency: 'monthly',
      priority:        0.5,
    },
  ];
}
