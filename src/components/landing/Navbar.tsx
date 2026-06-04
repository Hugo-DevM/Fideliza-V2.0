"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import type { Dictionary, Locale } from "@/lib/i18n";

interface NavbarProps {
  t: Dictionary["navbar"];
  lang: Locale;
  onLangChange: (lang: Locale) => void;
}

export function Navbar({ t, lang, onLangChange }: NavbarProps) {
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
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        scrolled
          ? "bg-gray-950/95 backdrop-blur-md border-b border-white/10"
          : "bg-transparent",
      ].join(" ")}
    >
      <Container className="flex items-center justify-between h-16">
        {/* Logo */}
        <a href="/">
          <img src="/logofideliza.svg" alt="Fideliza+" className="h-12" />
        </a>

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
          {/* <a
            href="/manual"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t.manual}
          </a> */}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          {/* <LinkButton href="/auth/login" size="sm">
            {t.signIn}
          </LinkButton> */}
          {/* Desktop CTA */}
          <LinkButton href="/auth/register" size="sm">
            {t.cta}
          </LinkButton>
          {/* Language toggle */}
          <div className="flex items-center gap-0.5 rounded-lg bg-white/5 border border-white/10 p-0.5">
            <button
              type="button"
              onClick={() => onLangChange("es")}
              className={[
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
                lang === "es"
                  ? "bg-indigo-500 text-white"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              ES
            </button>
            <button
              type="button"
              onClick={() => onLangChange("en")}
              className={[
                "px-2.5 py-1 rounded-md text-xs font-semibold transition-colors",
                lang === "en"
                  ? "bg-indigo-500 text-white"
                  : "text-gray-400 hover:text-white",
              ].join(" ")}
            >
              EN
            </button>
          </div>
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
              href="/manual"
              onClick={() => setMenuOpen(false)}
              className="text-sm text-gray-300 hover:text-white py-1"
            >
              {t.manual}
            </a>
            {/* Language toggle mobile */}
            <div className="flex items-center gap-0.5 rounded-lg bg-white/5 border border-white/10 p-0.5 self-start">
              <button
                type="button"
                onClick={() => {
                  onLangChange("es");
                  setMenuOpen(false);
                }}
                className={[
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                  lang === "es"
                    ? "bg-indigo-500 text-white"
                    : "text-gray-400 hover:text-white",
                ].join(" ")}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => {
                  onLangChange("en");
                  setMenuOpen(false);
                }}
                className={[
                  "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors",
                  lang === "en"
                    ? "bg-indigo-500 text-white"
                    : "text-gray-400 hover:text-white",
                ].join(" ")}
              >
                EN
              </button>
            </div>

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
