'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/Button';
import type { Dictionary } from '@/lib/i18n';

interface NavbarProps {
  t: Dictionary['navbar'];
}

export function Navbar({ t }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={[
        'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
        scrolled
          ? 'bg-gray-950/95 backdrop-blur-md border-b border-white/10'
          : 'bg-transparent',
      ].join(' ')}
    >
      <Container className="flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" aria-hidden="true">
              <path
                d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="currentColor"
                opacity="0.9"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="font-semibold text-white text-lg tracking-tight">
            Fideliza<span className="text-indigo-400">+</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
          <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white transition-colors">
            {t.howItWorks}
          </a>
          <a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">
            {t.features}
          </a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">
            {t.pricing}
          </a>
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a href="/auth/login" className="text-sm text-gray-400 hover:text-white transition-colors">
            {t.signIn}
          </a>
          <LinkButton href="/auth/register" size="sm">
            {t.cta}
          </LinkButton>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden text-gray-400 hover:text-white p-2 -mr-2"
          aria-label={menuOpen ? t.closeMenu : t.openMenu}
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-white/10">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <a href="#how-it-works" onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white py-1">{t.howItWorks}</a>
            <a href="#features"     onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white py-1">{t.features}</a>
            <a href="#pricing"      onClick={() => setMenuOpen(false)} className="text-sm text-gray-300 hover:text-white py-1">{t.pricing}</a>
            <LinkButton href="/auth/register" size="sm" className="w-full justify-center mt-2" onClick={() => setMenuOpen(false)}>
              {t.cta}
            </LinkButton>
          </nav>
        </div>
      )}
    </header>
  );
}
