import { Container } from '@/components/ui/Container';
import { WaitlistForm } from './WaitlistForm';
import { Reveal } from '@/components/ui/Reveal';
import type { Dictionary } from '@/lib/i18n';
import { withBrand } from '@/lib/brand';

interface CTAProps {
  t: Dictionary['cta'];
  waitlistT: Dictionary['waitlistForm'];
}

export function CTA({ t, waitlistT }: CTAProps) {
  return (
    <section id="waitlist" className="py-20 sm:py-28 bg-indigo-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} aria-hidden="true" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} aria-hidden="true" />

      <Container className="relative">
        <div className="max-w-2xl mx-auto text-center">
          <Reveal className="mb-6">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium text-indigo-100">{t.badge}</span>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">{t.heading}</h2>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="text-lg text-indigo-200 mb-10 leading-relaxed">{withBrand(t.body, 'font-bold text-white')}</p>
          </Reveal>

          <Reveal delay={0.24} direction="scale">
            <WaitlistForm variant="cta" t={waitlistT} />
          </Reveal>

          <Reveal delay={0.34} className="mt-10">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-indigo-300">
              {t.bullets.map((bullet) => (
                <span key={bullet} className="flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-400">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  {bullet}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
