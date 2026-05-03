import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale, type Locale } from '@/lib/i18n';

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export async function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'es' }];
}

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};

  const dict = await getDictionary(lang as Locale);
  const { meta } = dict;
  const canonical = lang === 'en' ? 'https://fideliza.app/en' : 'https://fideliza.app/es';
  const alternate = lang === 'en' ? 'https://fideliza.app/es' : 'https://fideliza.app/en';
  const alternateLang: Locale = lang === 'en' ? 'es' : 'en';

  return {
    title: meta.title,
    description: meta.description,
    metadataBase: new URL('https://fideliza.app'),
    alternates: {
      canonical,
      languages: {
        [lang]: canonical,
        [alternateLang]: alternate,
        'x-default': 'https://fideliza.app/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: lang === 'es' ? 'es_ES' : 'en_US',
      url: canonical,
      siteName: 'Fideliza+',
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: meta.ogTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.ogTitle,
      description: meta.ogDescription,
      images: ['/og-image.png'],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  return <>{children}</>;
}
