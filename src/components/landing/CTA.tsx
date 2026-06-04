import { Container } from '@/components/ui/Container';
import { WaitlistForm } from './WaitlistForm';
import type { Dictionary } from '@/lib/i18n';

interface CTAProps {
  t: Dictionary['cta'];
  waitlistT: Dictionary['waitlistForm'];
}

export function CTA({ t, waitlistT }: CTAProps) {
  return (
    <section id="waitlist" className="py-20 sm:py-28 bg-indigo-600 relative overflow-hidden">
      {/* Background decoration */}
      <div
        className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <Container className="relative">
        <div className="max-w-2xl mx-auto text-center">
          <div className="reveal inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-medium text-indigo-100">{t.badge}</span>
          </div>

          <h2 className="reveal reveal-d1 text-3xl sm:text-4xl font-bold text-white mb-4">
            {t.heading}
          </h2>
          <p className="reveal reveal-d2 text-lg text-indigo-200 mb-10 leading-relaxed">
            {t.body}
          </p>

          <div className="reveal reveal-d3">
            <WaitlistForm variant="cta" t={waitlistT} />
          </div>

          <div className="reveal reveal-d4 mt-10 flex flex-wrap justify-center gap-6 text-sm text-indigo-300">
            {t.bullets.map((bullet) => (
              <span key={bullet} className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-indigo-400">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
                {bullet}
              </span>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
