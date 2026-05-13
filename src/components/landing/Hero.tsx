import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Dictionary } from '@/lib/i18n';

interface HeroProps {
  t: Dictionary['hero'];
}

function LoyaltyCardMock({ t }: { t: Dictionary['hero']['card'] }) {
  return (
    <div className="relative mx-auto w-full max-w-sm select-none">
      {/* Glow */}
      <div
        className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)' }}
      >
        {/* Card header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4">
          <div>
            <div className="text-xs text-indigo-300 font-medium mb-0.5 uppercase tracking-wide">Brew &amp; Bean Coffee</div>
            <div className="text-white font-semibold text-lg">Alice Méndez</div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/30 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-indigo-300">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
            </svg>
          </div>
        </div>

        {/* Points balance */}
        <div className="px-5 pb-4">
          <div className="rounded-xl bg-white/8 border border-white/10 p-4 flex items-end justify-between">
            <div>
              <div className="text-xs text-indigo-300 mb-1">{t.pointsLabel}</div>
              <div className="text-3xl font-bold text-white tracking-tight">350</div>
              <div className="text-xs text-indigo-300 mt-0.5">{t.untilNextReward}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-indigo-300 mb-1">{t.lifetimeLabel}</div>
              <div className="text-lg font-semibold text-indigo-200">600</div>
            </div>
          </div>
        </div>

        {/* Stamp card */}
        <div className="px-5 pb-5">
          <div className="rounded-xl bg-white/8 border border-white/10 p-4">
            <div className="text-xs text-indigo-300 mb-3 font-medium">{t.punchCardLabel}</div>
            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className={[
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs',
                    i < 7
                      ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-800'
                      : 'bg-white/10 border border-white/15 text-white/30',
                  ].join(' ')}
                >
                  {i < 7 ? (
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M12 2a7 7 0 100 14A7 7 0 0012 2z M8.5 12a3.5 3.5 0 117 0 3.5 3.5 0 01-7 0z"/>
                    </svg>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Access code footer */}
        <div className="px-5 pb-5">
          <div className="flex items-center justify-between text-xs text-indigo-400">
            <span>{t.accessCodeLabel}</span>
            <span className="font-mono tracking-widest bg-white/8 rounded px-2 py-0.5 text-indigo-200">ALIC-BB01</span>
          </div>
        </div>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 bg-emerald-500 text-white text-xs font-semibold rounded-full px-2.5 py-1 shadow-lg shadow-emerald-900/40">
        {t.noAppBadge}
      </div>
    </div>
  );
}

export function Hero({ t }: HeroProps) {
  return (
    <section className="hero-bg min-h-screen flex items-center pt-16 pb-20 overflow-hidden">
      <Container className="py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div className="text-center lg:text-left">
            <Badge color="indigo" className="mb-6 animate-fade-in">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 inline-block" />
              {t.badge}
            </Badge>

            <h1 className="animate-fade-in-delay-1 text-4xl sm:text-5xl lg:text-[3.25rem] font-bold leading-[1.15] text-white mb-6">
              {t.headingPlain}
              <span className="gradient-text">{t.headingGradient}</span>
            </h1>

            <p className="animate-fade-in-delay-2 text-lg text-gray-400 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              {t.body}
            </p>

            <div className="animate-fade-in-delay-3 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <LinkButton href="#waitlist" size="lg" className="relative pulse-ring">
                {t.cta1}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </LinkButton>
              <LinkButton href="#how-it-works" size="lg" variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                {t.cta2}
              </LinkButton>
            </div>

            {/* Social proof */}
            <div className="animate-fade-in-delay-3 mt-10 flex items-center gap-6 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {['B', 'M', 'S', 'K'].map((letter, i) => (
                  <div
                    key={letter}
                    className="w-8 h-8 rounded-full ring-2 ring-gray-900 flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: ['#4f46e5','#7c3aed','#0891b2','#059669'][i] }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-400">
                <span className="text-white font-semibold">{t.socialProofCount}</span>{' '}
                {t.socialProofText}
              </p>
            </div>
          </div>

          {/* Right: product mockup */}
          <div className="flex justify-center lg:justify-end animate-fade-in-delay-2">
            <LoyaltyCardMock t={t.card} />
          </div>
        </div>
      </Container>
    </section>
  );
}
