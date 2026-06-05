import type { MetadataRoute } from 'next';

const BASE = 'https://fideliza.app';
const NOW  = new Date();

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Landing (canonical root) ────────────────────────────────────
    // /en and /es both redirect to / — only the canonical URL goes in sitemap.
    {
      url:             `${BASE}/`,
      lastModified:    NOW,
      changeFrequency: 'weekly',
      priority:        1.0,
    },

    // ── Legal & docs ────────────────────────────────────────────────
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
