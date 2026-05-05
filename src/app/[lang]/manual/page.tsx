import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';
import { TocNav } from './TocNav';
import { ContentEs, tocEs } from './content/es';
import { ContentEn, tocEn } from './content/en';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  const isEs = lang === 'es';
  return {
    title: isEs ? 'Manual de Usuario' : 'User Manual',
    description: isEs
      ? 'Guía completa para usar Fideliza+: programas de puntos, sellos, visitas y cashback.'
      : 'Complete guide for using Fideliza+: points, stamps, visits and cashback programs.',
  };
}

export default async function ManualPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const isEs = (lang as Locale) === 'es';
  const toc = isEs ? tocEs : tocEn;
  const backLabel = isEs ? 'Volver al inicio' : 'Back to home';
  const version = isEs ? 'Manual de Usuario · v1.0 · Mayo 2026' : 'User Manual · v1.0 · May 2026';
  const docsLabel = isEs ? 'Documentación' : 'Documentation';
  const title = isEs ? 'Manual de Usuario' : 'User Manual';
  const description = isEs
    ? 'Configura y opera tu programa de fidelización en Fideliza+. Basado en la implementación real del sistema.'
    : 'Configure and operate your loyalty program in Fideliza+. Based on the real system implementation.';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-white/10">
        <Container className="flex items-center justify-between h-14">
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" aria-hidden="true">
                <path
                  d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"
                  fill="currentColor" opacity="0.9"
                />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-white text-base tracking-tight">
              Fideliza<span className="text-indigo-400">+</span>
            </span>
          </a>

          <div className="flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1 rounded-md bg-white/5 border border-white/10 p-0.5">
              <a
                href={`/es/manual`}
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  isEs ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white',
                ].join(' ')}
              >
                ES
              </a>
              <a
                href={`/en/manual`}
                className={[
                  'px-2.5 py-1 rounded text-xs font-medium transition-colors',
                  !isEs ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white',
                ].join(' ')}
              >
                EN
              </a>
            </div>

            <span className="text-xs text-gray-500 hidden sm:block">{version}</span>

            <a
              href={`/${lang}`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {backLabel}
            </a>
          </div>
        </Container>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-indigo-950/40 to-gray-950 border-b border-white/10">
        <Container className="py-12">
          <p className="text-xs font-semibold text-indigo-400 uppercase tracking-widest mb-3">{docsLabel}</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-gray-400 max-w-xl">{description}</p>
        </Container>
      </div>

      {/* ── Main layout: TOC + content ── */}
      <Container className="py-10">
        <div className="flex gap-10 items-start">
          <TocNav items={toc} />

          <main className="flex-1 min-w-0 space-y-0">
            {isEs ? <ContentEs /> : <ContentEn />}

            <div className="pt-10 pb-4 text-center text-xs text-gray-600">
              Fideliza+ · v1.0 ·{' '}
              <a href={`/${lang}`} className="hover:text-gray-400 transition-colors">
                {backLabel}
              </a>
            </div>
          </main>
        </div>
      </Container>
    </div>
  );
}
