import { Container } from '@/components/ui/Container';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import type { Dictionary } from '@/lib/i18n';
import { withBrand } from '@/lib/brand';

const BENEFIT_ICONS = [
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>,
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
  </svg>,
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
  </svg>,
  <svg key="3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
  </svg>,
];

const AVATAR_COLORS = ['bg-indigo-500', 'bg-violet-500', 'bg-sky-500'];

interface BenefitsProps {
  t: Dictionary['benefits'];
}

export function Benefits({ t }: BenefitsProps) {
  return (
    <section className="py-20 sm:py-28 bg-white">
      <Container>
        {/* Stats — stagger */}
        <RevealGroup className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20" stagger={0.09}>
          {t.stats.map((b) => (
            <RevealItem key={b.stat} direction="up">
              <div className="text-center">
                <div className="text-4xl font-bold mb-1 tabular-nums stat-shimmer">{b.stat}</div>
                <div className="text-sm font-semibold text-gray-800 mb-2">{b.unit}</div>
                <p className="text-xs text-gray-500 leading-relaxed">{b.description}</p>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Benefits grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <Reveal direction="left" className="mb-3">
              <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{t.label}</p>
            </Reveal>
            <Reveal delay={0.06}>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">{t.heading}</h2>
            </Reveal>
            <Reveal delay={0.12}>
              <p className="text-lg text-gray-500 mb-8 leading-relaxed">{withBrand(t.body)}</p>
            </Reveal>

            <RevealGroup className="space-y-5" stagger={0.1}>
              {t.items.map((benefit, i) => (
                <RevealItem key={i} direction="left">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                      {BENEFIT_ICONS[i]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800 mb-0.5">{benefit.title}</div>
                      <div className="text-sm text-gray-500 leading-relaxed">{withBrand(benefit.body)}</div>
                    </div>
                  </div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>

          {/* Dashboard mockup */}
          <Reveal direction="right">
            <div className="relative">
              <div
                className="absolute inset-0 rounded-3xl opacity-10 blur-3xl"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                aria-hidden="true"
              />
              <div className="relative rounded-2xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="mx-auto text-xs text-gray-400 font-mono">marios.fideliza.app/dashboard</div>
                </div>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t.dashboard.customers,   value: '142' },
                      { label: t.dashboard.thisMonth,   value: '+28' },
                      { label: t.dashboard.redemptions, value: '17' },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-gray-50 border border-gray-100 p-3 text-center">
                        <div className="text-xl font-bold text-gray-900">{s.value}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">{t.dashboard.recentActivity}</div>
                    {t.dashboard.activity.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                        <div className={`w-7 h-7 rounded-full ${AVATAR_COLORS[i]} flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0`}>{item.name[0]}</div>
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-gray-800 truncate">{item.name}</div>
                          <div className="text-xs text-gray-400">{item.action}</div>
                        </div>
                        <div className="ml-auto text-[10px] text-gray-300 whitespace-nowrap">{item.time}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}
