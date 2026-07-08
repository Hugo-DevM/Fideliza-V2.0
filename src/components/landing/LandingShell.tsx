'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Dictionary, Locale } from '@/lib/i18n';
import { Navbar } from './Navbar';
import { AnnouncementBar } from './AnnouncementBar';
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

const emptySubscribe = () => () => {};

export function LandingShell({ dictEn, dictEs }: Props) {
  // false during SSR/hydration render, true afterwards
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [langOverride, setLangOverride] = useState<Locale | null>(null);
  const [barVisible, setBarVisible] = useState(false);

  // Default to Spanish (primary market); override from localStorage after hydration
  const saved = mounted ? (localStorage.getItem('landing-lang') as Locale | null) : null;
  const lang: Locale = langOverride ?? (saved === 'en' || saved === 'es' ? saved : 'es');

  function handleLangChange(newLang: Locale) {
    setLangOverride(newLang);
    localStorage.setItem('landing-lang', newLang);
  }

  const dict = lang === 'en' ? dictEn : dictEs;

  // Avoid flash: render nothing until localStorage is read
  if (!mounted) return null;

  return (
    <>
      <ScrollReveal />
      <AnnouncementBar t={dict.pricing.coupon} onVisibleChange={setBarVisible} />
      <Navbar t={dict.navbar} lang={lang} onLangChange={handleLangChange} offsetTop={barVisible} />
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
