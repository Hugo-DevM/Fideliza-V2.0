import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import type { Dictionary } from '@/lib/i18n';
import { withBrand } from '@/lib/brand';

type VisualsDict = Dictionary['features']['visuals'];

function ProgramTypesVisual({ t }: { t: VisualsDict['programTypes'] }) {
  const colors = [
    { bg: 'bg-indigo-100', text: 'text-indigo-700', icon: '★' },
    { bg: 'bg-violet-100', text: 'text-violet-700', icon: '◉' },
    { bg: 'bg-sky-100',    text: 'text-sky-700',    icon: '✓' },
  ];
  return (
    <div className="flex gap-3 flex-wrap">
      {t.types.map((type, i) => (
        <div
          key={type.label}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${colors[i].bg} ${
            type.active ? 'border-indigo-300 shadow-sm' : 'border-transparent opacity-70'
          }`}
        >
          <span className={`text-base ${colors[i].text}`}>{colors[i].icon}</span>
          <span className={`text-sm font-medium ${colors[i].text}`}>{type.label}</span>
        </div>
      ))}
      <div className="w-full mt-2 h-1.5 rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full w-[58%] bg-indigo-500 rounded-full" />
      </div>
      <div className="flex justify-between w-full text-xs text-gray-500">
        <span>{t.balance}</span>
        <span className="text-indigo-600 font-medium">{t.nextReward}</span>
      </div>
    </div>
  );
}

function AccessCodeVisual({ t }: { t: VisualsDict['accessCode'] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">A</div>
        <div>
          <div className="text-sm font-medium text-gray-800">Alice Méndez</div>
          <div className="text-xs text-gray-400 font-mono tracking-wider">ALIC-BB01</div>
        </div>
        <div className="ml-auto text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-full px-2 py-0.5">{t.status}</div>
      </div>
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
        {t.hint}
      </p>
    </div>
  );
}

function SubdomainVisual({ t }: { t: VisualsDict['subdomain'] }) {
  const urls = ['marios.fideliza.app', 'brewbean.fideliza.app', 'yourshop.fideliza.app'];
  return (
    <div className="space-y-2">
      {urls.map((url, i) => (
        <div key={url} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-mono ${i === 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-3.5 h-3.5 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          {url}
        </div>
      ))}
      <p className="text-xs text-gray-400 pt-1">{t.hint}</p>
    </div>
  );
}

function TransactionVisual({ t }: { t: VisualsDict['transaction'] }) {
  return (
    <div className="space-y-2">
      {t.rows.map((tx, i) => (
        <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${tx.type === 'earn' ? 'bg-emerald-500' : 'bg-red-400'}`} />
            <span className="text-gray-700">{tx.label}</span>
          </div>
          <span className={`font-semibold tabular-nums ${tx.type === 'earn' ? 'text-emerald-600' : 'text-red-500'}`}>{tx.points}</span>
        </div>
      ))}
      <div className="flex justify-between pt-2 px-1 text-xs text-gray-500">
        <span>{t.balanceLabel}</span>
        <span className="font-semibold text-gray-800 tabular-nums">350 pts</span>
      </div>
    </div>
  );
}

interface FeaturesProps {
  t: Dictionary['features'];
}

export function Features({ t }: FeaturesProps) {
  const visuals = [
    <ProgramTypesVisual key="programs" t={t.visuals.programTypes} />,
    <AccessCodeVisual   key="access"   t={t.visuals.accessCode} />,
    <SubdomainVisual    key="subdomain" t={t.visuals.subdomain} />,
    <TransactionVisual  key="txn"      t={t.visuals.transaction} />,
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-gray-50">
      <Container>
        {/* Section header */}
        <div className="text-center mb-16">
          <Reveal direction="left" className="mb-3">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{t.label}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t.heading}</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">{t.body}</p>
          </Reveal>
        </div>

        {/* Cards — stagger */}
        <RevealGroup className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger={0.1}>
          {t.items.map((item, i) => (
            <RevealItem key={i} direction="scale">
              <div className="card-hover bg-white rounded-2xl border border-gray-200 p-6 flex flex-col gap-5 h-full">
                <div>
                  <Badge color={item.badgeColor} className="mb-4">{item.badge}</Badge>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{withBrand(item.description)}</p>
                </div>
                <div className="mt-auto pt-4 border-t border-gray-100">{visuals[i]}</div>
              </div>
            </RevealItem>
          ))}
        </RevealGroup>
      </Container>
    </section>
  );
}
