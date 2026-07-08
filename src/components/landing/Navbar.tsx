"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import type { Dictionary, Locale } from "@/lib/i18n";

interface NavbarProps {
  t: Dictionary["navbar"];
  lang: Locale;
  onLangChange: (lang: Locale) => void;
  /** Shifts the navbar down while the announcement bar is visible. */
  offsetTop?: boolean;
}

export function Navbar({ t, lang, onLangChange, offsetTop = false }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "fixed left-0 right-0 z-50 transition-all duration-200",
        offsetTop ? "top-10" : "top-0",
        scrolled
          ? "bg-gray-950/95 backdrop-blur-md border-b border-white/10"
          : "bg-transparent",
      ].join(" ")}
    >
      <Container className="flex items-center justify-between h-16">
        {/* Logo — scrolls back to top when already on the landing */}
        <Link
          href="/"
          onClick={(e) => {
            if (window.location.pathname === "/") {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          <Image src="/logofideliza.svg" alt="Fideliza" width={144} height={48} className="h-12 w-auto" />
        </Link>

        {/* Desktop nav */}
        <nav
          className="hidden md:flex items-center gap-6"
          aria-label="Main navigation"
        >
          <a
            href="#how-it-works"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.howItWorks}
          </a>
          <a
            href="#features"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.features}
          </a>
          <a
            href="#pricing"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.pricing}
          </a>
          <a
            href="#faq"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.faq}
          </a>
          {/* <a
            href="/manual"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.manual}
          </a> */}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* Language toggle */}
          <button
            type="button"
            onClick={() => onLangChange(lang === "es" ? "en" : "es")}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-md px-3 py-1.5 transition-colors"
            aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            {lang === "es" ? "English" : "Español"}
          </button>
          {/* <LinkButton href="/auth/login" size="sm">
            {t.signIn}
          </LinkButton> */}
          {/* Desktop CTA */}
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </Container>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-950 border-t border-white/10">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <a
              href="#how-it-works"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white py-1"
            >
              {t.howItWorks}
            </a>
            <a
              href="#features"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white py-1"
            >
              {t.features}
            </a>
            <a
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white py-1"
            >
              {t.pricing}
            </a>
            <a
              href="#faq"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white py-1"
            >
              {t.faq}
            </a>
            <a
              href="/manual"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white py-1"
            >
              {t.manual}
            </a>
            {/* Language toggle mobile */}
            <button
              type="button"
              onClick={() => {
                onLangChange(lang === "es" ? "en" : "es");
                setMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-md px-3 py-1.5 transition-colors self-start"
              aria-label={lang === "es" ? "Switch to English" : "Cambiar a Español"}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
              </svg>
              {lang === "es" ? "English" : "Español"}
            </button>

            <LinkButton
              href="/auth/register"
              size="sm"
              className="w-full justify-center mt-2"
              onClick={() => setMenuOpen(false)}
            >
              {t.cta}
            </LinkButton>
          </nav>
        </div>
      )}
    </header>
  );
}
