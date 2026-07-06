'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import type { Dictionary } from '@/lib/i18n';
import { withBrand } from '@/lib/brand';

/** Animated number that slides up/down when the value changes. */
function AnimatedPrice({ value }: { value: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="inline-block text-4xl font-bold tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

/** Animated subtitle line (period + annual note) that fades when swapping. */
function AnimatedPeriod({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={String(children)}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="inline-block text-sm pb-1"
      >
        {children}
      </motion.span>
    </AnimatePresence>
  );
}

interface PricingProps {
  t: Dictionary['pricing'];
}

export function Pricing({ t }: PricingProps) {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
      <Container>
        <div className="text-center mb-10">
          <Reveal direction="left" className="mb-3">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{t.label}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t.heading}</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">{t.body}</p>
          </Reveal>

          {/* Billing toggle */}
          <Reveal delay={0.18}>
            <div className="mt-8 inline-flex items-center gap-1 rounded-xl bg-white border border-gray-200 p-1 shadow-sm">
              {/* Mensual */}
              <button
                onClick={() => setAnnual(false)}
                className="relative rounded-lg px-4 py-2 text-sm font-medium"
              >
                {!annual && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-lg bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-colors duration-150 ${!annual ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}>
                  {t.billingMonthly}
                </span>
              </button>

              {/* Anual */}
              <button
                onClick={() => setAnnual(true)}
                className="relative rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2"
              >
                {annual && (
                  <motion.div
                    layoutId="billing-pill"
                    className="absolute inset-0 rounded-lg bg-indigo-600"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className={`relative z-10 transition-colors duration-150 ${annual ? 'text-white' : 'text-gray-500'}`}>
                  {t.billingAnnual}
                </span>
                <motion.span
                  animate={{
                    backgroundColor: annual ? 'rgba(255,255,255,0.2)' : 'rgb(220,252,231)',
                    color: annual ? '#ffffff' : '#15803d',
                  }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10 rounded-full px-2 py-0.5 text-[10px] font-bold"
                >
                  {t.annualBadge}
                </motion.span>
              </button>
            </div>
          </Reveal>
        </div>

        <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.12}>
          {t.plans.map((plan) => {
            const showAnnual    = annual && plan.annualPrice !== '$0';
            const displayPrice  = showAnnual ? plan.annualPrice : plan.price;
            const originalPrice = showAnnual ? plan.originalAnnualPrice : plan.originalPrice;
            const displayPeriod = showAnnual ? `/${t.billingAnnual.toLowerCase()}` : plan.period;
            const isLaunch      = Boolean(originalPrice);

            return (
              <RevealItem key={plan.name} direction="scale" className="h-full">
                <div className={[
                  'rounded-2xl border p-6 flex flex-col h-full relative',
                  plan.highlight
                    ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-200/60 text-white'
                    : plan.comingSoon
                      ? 'bg-gray-50 border-gray-200 text-gray-400'
                      : 'bg-white border-gray-200 text-gray-900 card-hover',
                ].join(' ')}>
                  {/* Plan header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-sm font-semibold ${plan.highlight ? 'text-indigo-200' : plan.comingSoon ? 'text-gray-400' : 'text-gray-500'}`}>
                        {plan.name}
                      </span>
                      {plan.badge ? (
                        <Badge color={plan.comingSoon ? 'gray' : 'green'} className="text-[11px]">{plan.badge}</Badge>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap items-end gap-x-1 gap-y-0.5 mb-1">
                      <span className="overflow-hidden">
                        <AnimatedPrice value={displayPrice} />
                      </span>
                      <span className={`overflow-hidden ${plan.highlight ? 'text-indigo-300' : plan.comingSoon ? 'text-gray-300' : 'text-gray-400'}`}>
                        <AnimatedPeriod>{displayPeriod}</AnimatedPeriod>
                      </span>
                      {originalPrice && (
                        <span className={`text-sm line-through pb-1 whitespace-nowrap ${plan.highlight ? 'text-indigo-300' : 'text-gray-400'}`}>
                          {originalPrice}
                        </span>
                      )}
                    </div>
                    {isLaunch && (
                      <p className={`text-xs font-medium mb-1 ${plan.highlight ? 'text-amber-300' : 'text-amber-600'}`}>
                        🔥 Precio de lanzamiento · tiempo limitado
                      </p>
                    )}

                    {/* Per-month equivalent when annual */}
                    <div className="min-h-4 mb-2">
                      <AnimatePresence initial={false}>
                        {showAnnual && plan.annualMonthly && (
                          <motion.p
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className={`text-xs ${plan.highlight ? 'text-indigo-300' : 'text-gray-400'}`}
                          >
                            ≈ {plan.annualMonthly} · {t.annualNote}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                    <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-indigo-200' : plan.comingSoon ? 'text-gray-400' : 'text-gray-500'}`}>
                      {withBrand(plan.description, plan.highlight ? 'font-bold text-white' : plan.comingSoon ? 'font-bold text-gray-400' : 'font-bold text-gray-900')}
                    </p>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <svg viewBox="0 0 24 24" fill="currentColor" className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-300' : plan.comingSoon ? 'text-gray-300' : 'text-indigo-500'}`}>
                          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                        </svg>
                        <span className={plan.highlight ? 'text-indigo-100' : plan.comingSoon ? 'text-gray-400' : 'text-gray-700'}>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm opacity-40">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 flex-shrink-0 mt-0.5 text-gray-400">
                          <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                        </svg>
                        <span className="text-gray-400">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.comingSoon ? (
                    <button disabled className="w-full justify-center inline-flex items-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-400 cursor-not-allowed">
                      {plan.cta}
                    </button>
                  ) : (
                    <LinkButton href={plan.href} variant={plan.highlight ? 'secondary' : 'outline'} className="w-full justify-center">
                      {plan.cta}
                    </LinkButton>
                  )}
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>

        <Reveal delay={0.2} className="text-center mt-8">
          <p className="text-sm text-gray-400">{t.footnote}</p>
        </Reveal>
      </Container>
    </section>
  );
}
