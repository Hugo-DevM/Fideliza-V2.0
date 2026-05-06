import { notFound } from 'next/navigation';
import { getDictionary, isValidLocale, type Locale } from '@/lib/i18n';
import { Navbar } from '@/components/landing/Navbar';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Features } from '@/components/landing/Features';
import { Benefits } from '@/components/landing/Benefits';
import { MultiDevice } from '@/components/landing/MultiDevice';
import { Pricing } from '@/components/landing/Pricing';
import { CTA } from '@/components/landing/CTA';
import { Footer } from '@/components/landing/Footer';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LandingPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const dict = await getDictionary(lang as Locale);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Fideliza+',
    applicationCategory: 'BusinessApplication',
    description: dict.meta.description,
    inLanguage: lang,
    offers: dict.pricing.plans.map((plan) => ({
      '@type': 'Offer',
      name: plan.name,
      price: plan.price.replace('$', ''),
      priceCurrency: 'USD',
      description: plan.description,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
