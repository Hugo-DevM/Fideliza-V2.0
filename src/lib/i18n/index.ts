import { en } from './translations/en';

export type Dictionary = typeof en;
export type Locale = 'en' | 'es';

export const locales: Locale[] = ['en', 'es'];
export const defaultLocale: Locale = 'en';

export function isValidLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale);
}

/**
 * Parses the Accept-Language header and returns the best matching locale.
 * Falls back to defaultLocale if no match is found.
 */
export function getPreferredLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;

  // Parse "es-MX,es;q=0.9,en;q=0.8" into [{ lang: 'es', q: 0.9 }, ...]
  const tags = acceptLanguage
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag.trim().toLowerCase().slice(0, 2), q: q ? parseFloat(q) : 1.0 };
    })
    .sort((a, b) => b.q - a.q);

  for (const { lang } of tags) {
    if (isValidLocale(lang)) return lang;
  }

  return defaultLocale;
}

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case 'es':
      return (await import('./translations/es')).es;
    case 'en':
    default:
      return en;
  }
}
