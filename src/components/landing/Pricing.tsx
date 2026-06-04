import { Container } from '@/components/ui/Container';
import { LinkButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { Dictionary } from '@/lib/i18n';

interface PricingProps {
  t: Dictionary['pricing'];
}

export function Pricing({ t }: PricingProps) {
  const stagger = ['', 'reveal-d2', 'reveal-d4'];

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-gray-50">
      <Container>
        <div className="text-center mb-14">
          <p className="reveal reveal-left text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            {t.label}
          </p>
          <h2 className="reveal text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {t.heading}
          </h2>
          <p className="reveal reveal-d1 text-lg text-gray-500 max-w-xl mx-auto">
            {t.body}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {t.plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={[
                'reveal-scale',
                stagger[idx],
                'rounded-2xl border p-6 flex flex-col',
                plan.highlight
                  ? 'bg-indigo-600 border-indigo-500 shadow-xl shadow-indigo-200 text-white'
                  : 'bg-white border-gray-200 text-gray-900 card-hover',
              ].join(' ')}
            >
              {/* Plan header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-semibold ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                    {plan.name}
                  </span>
                  {plan.badge ? (
                    <Badge color="green" className="text-[11px]">{plan.badge}</Badge>
                  ) : null}
                </div>
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold tabular-nums">{plan.price}</span>
                  <span className={`text-sm pb-1 ${plan.highlight ? 'text-indigo-300' : 'text-gray-400'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm leading-relaxed ${plan.highlight ? 'text-indigo-200' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2.5 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? 'text-indigo-300' : 'text-indigo-500'}`}
                    >
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                    <span className={plan.highlight ? 'text-indigo-100' : 'text-gray-700'}>{f}</span>
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

              <LinkButton
                href={plan.href}
                variant={plan.highlight ? 'secondary' : 'outline'}
                className="w-full justify-center"
              >
                {plan.cta}
              </LinkButton>
            </div>
          ))}
        </div>

        <p className="reveal text-center text-sm text-gray-400 mt-8">
          {t.footnote}
        </p>
      </Container>
    </section>
  );
}
