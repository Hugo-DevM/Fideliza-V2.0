import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getDictionary, isValidLocale, locales, type Locale } from '@/lib/i18n';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { Benefits } from '@/components/landing/Benefits';
import { MultiDevice } from '@/components/landing/MultiDevice';
import { Pricing } from '@/components/landing/Pricing';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

const BASE_URL = 'https://fideliza.app';

interface Props {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!isValidLocale(lang)) return {};

  const dict = await getDictionary(lang as Locale);
  const url = `${BASE_URL}/${lang}`;
  const ogLocale  = lang === 'es' ? 'es_ES' : 'en_US';
  const altLocale = lang === 'es' ? 'en_US' : 'es_ES';

  return {
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      canonical: url,
      languages: {
        en:          `${BASE_URL}/en`,
        es:          `${BASE_URL}/es`,
        'x-default': `${BASE_URL}/en`,
      },
    },
    openGraph: {
      title:           dict.meta.ogTitle,
      description:     dict.meta.ogDescription,
      url,
      siteName:        'Fideliza+',
      type:            'website',
      locale:          ogLocale,
      alternateLocale: [altLocale],
      // og:image is injected automatically by opengraph-image.tsx in this segment
    },
    twitter: {
      card:        'summary_large_image',
      title:       dict.meta.ogTitle,
      description: dict.meta.ogDescription,
      // twitter:image is injected automatically by opengraph-image.tsx
    },
    robots: {
      index:  true,
      follow: true,
      googleBot: {
        index:               true,
        follow:              true,
        'max-image-preview': 'large',
        'max-snippet':       -1,
      },
    },
  };
}

export default async function LandingPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = await getDictionary(lang as Locale);
  const url  = `${BASE_URL}/${lang}`;

  const jsonLd = [
    // WebSite — enables sitelinks search box if eligible
    {
      '@context': 'https://schema.org',
      '@type':    'WebSite',
      name:       'Fideliza+',
      url:        BASE_URL,
      inLanguage: lang,
      potentialAction: {
        '@type':       'SearchAction',
        target:        `${BASE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    // Organization
    {
      '@context': 'https://schema.org',
      '@type':    'Organization',
      name:       'Fideliza+',
      url:        BASE_URL,
      logo:       `${BASE_URL}/logofpurple.svg`,
      sameAs:     [],
      contactPoint: {
        '@type':       'ContactPoint',
        contactType:   'customer support',
        email:         'hola@fideliza.app',
        availableLanguage: ['Spanish', 'English'],
      },
    },
    // SoftwareApplication
    {
      '@context':           'https://schema.org',
      '@type':              'SoftwareApplication',
      name:                 'Fideliza+',
      applicationCategory:  'BusinessApplication',
      operatingSystem:      'Web',
      url,
      description:          dict.meta.description,
      inLanguage:           lang,
      offers: dict.pricing.plans.map((plan) => ({
        '@type':        'Offer',
        name:           plan.name,
        price:          plan.price.replace('$', ''),
        priceCurrency:  'USD',
        description:    plan.description,
      })),
    },
  ];

  return (
    <>
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Navbar t={dict.navbar} />
      <main>
        <Hero t={dict.hero} />
        <HowItWorks t={dict.howItWorks} />
        <Features t={dict.features} />
        <Benefits t={dict.benefits} />
        <MultiDevice t={dict.multiDevice} />
        <Pricing t={dict.pricing} />
        <CTA t={dict.cta} waitlistT={dict.waitlistForm} />
      </main>
      <Footer t={dict.footer} />
    </>
  );
}
