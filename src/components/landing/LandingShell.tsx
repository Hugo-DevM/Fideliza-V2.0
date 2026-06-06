'use client';

import { useState, useEffect } from 'react';
import type { Dictionary, Locale } from '@/lib/i18n';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { Features } from './Features';
import { Benefits } from './Benefits';
import { MultiDevice } from './MultiDevice';
import { Pricing } from './Pricing';
import { FAQ } from './FAQ';
import { CTA } from './CTA';
import { Footer } from './Footer';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface Props {
  dictEn: Dictionary;
  dictEs: Dictionary;
}

export function LandingShell({ dictEn, dictEs }: Props) {
  // Default to Spanish (primary market); override from localStorage after hydration
  const [lang, setLang] = useState<Locale>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('landing-lang') as Locale | null;
    if (saved === 'en' || saved === 'es') setLang(saved);
    setMounted(true);
  }, []);

  function handleLangChange(newLang: Locale) {
    setLang(newLang);
    localStorage.setItem('landing-lang', newLang);
  }

  const dict = lang === 'en' ? dictEn : dictEs;

  // Avoid flash: render nothing until localStorage is read
  if (!mounted) return null;

  return (
    <>
      <ScrollReveal />
      <Navbar t={dict.navbar} lang={lang} onLangChange={handleLangChange} />
      <main>
        <Hero t={dict.hero} />
        <HowItWorks t={dict.howItWorks} />
        <Features t={dict.features} />
        <Benefits t={dict.benefits} />
        <MultiDevice t={dict.multiDevice} />
        <Pricing t={dict.pricing} />
        <FAQ t={dict.faq} />
        <CTA t={dict.cta} waitlistT={dict.waitlistForm} />
      </main>
      <Footer t={dict.footer} />
    </>
  );
}
