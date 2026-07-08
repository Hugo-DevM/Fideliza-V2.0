import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import type { Dictionary } from '@/lib/i18n';
import { withBrand } from '@/lib/brand';

type VisualsDict = Dictionary['features']['visuals'];

function ProgramTypesVisual({ t }: { t: VisualsDict['programTypes'] }) {
  const colors = [
    { bg: 'bg-indigo-100',  text: 'text-indigo-700',  icon: '★' },
    { bg: 'bg-violet-100',  text: 'text-violet-700',  icon: '◉' },
    { bg: 'bg-sky-100',     text: 'text-sky-700',     icon: '✓' },
    { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: '$' },
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

const engagementIcons: Record<string, { emoji: string; bg: string }> = {
  flash:    { emoji: '⚡', bg: 'bg-amber-100' },
  mission:  { emoji: '🎯', bg: 'bg-indigo-100' },
  birthday: { emoji: '🎂', bg: 'bg-pink-100' },
};

function EngagementVisual({ t }: { t: VisualsDict['engagement'] }) {
  return (
    <div className="space-y-2">
      {t.rows.map((row) => {
        const icon = engagementIcons[row.icon];
        return (
          <div key={row.title} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className={`w-7 h-7 rounded-lg ${icon.bg} flex items-center justify-center text-sm flex-shrink-0`}>
              {icon.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm text-gray-700 truncate">{row.title}</div>
              <div className="text-xs text-gray-400">{row.meta}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GrowthVisual({ t }: { t: VisualsDict['growth'] }) {
  const tierColors = [
    { bg: 'bg-slate-100',  text: 'text-slate-600',  ring: 'border-transparent' },
    { bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'border-amber-300 shadow-sm' },
    { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'border-transparent' },
  ];
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {t.tiers.map((tier, i) => (
          <div
            key={tier.label}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${tierColors[i].bg} ${tierColors[i].text} ${
              tier.active ? tierColors[i].ring : 'border-transparent opacity-60'
            }`}
          >
            {tier.active && <span>👑</span>}
            {tier.label}
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400">{t.tierHint}</p>
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span>🤝</span>
          <span className="text-gray-700 truncate">{t.referral}</span>
        </div>
        <span className="font-semibold text-emerald-600 tabular-nums flex-shrink-0">{t.referralPoints}</span>
      </div>
    </div>
  );
}

function WhatsAppVisual({ t }: { t: VisualsDict['whatsapp'] }) {
  return (
    <div className="space-y-3">
      {/* WhatsApp message bubble */}
      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500">
            <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm5 13.9c-.2.6-1.2 1.1-1.7 1.2-.4 0-.9.1-3-.6-2.5-1-4.1-3.5-4.2-3.7-.1-.2-1-1.3-1-2.6 0-1.2.6-1.8.9-2 .2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.4l.8 2c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.5.1.3.6 1 1.3 1.7.9.8 1.7 1.1 2 1.2.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.6-.1l1.9.9c.2.1.4.2.4.3.1.1.1.5-.2 1z" />
          </svg>
          <span className="text-[11px] font-semibold text-emerald-700">{t.sender}</span>
          <span className="ml-auto text-[10px] text-gray-400">{t.time}</span>
        </div>
        <p className="text-sm text-gray-700 leading-snug">{t.message}</p>
      </div>
      {/* Analytics stat row */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-sm">
        <span className="text-gray-500 text-xs">{t.statLabel}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-bold text-gray-800 tabular-nums">{t.statValue}</span>
          <span className="text-xs font-semibold text-emerald-600">{t.statDelta}</span>
        </span>
      </div>
    </div>
  );
}

interface FeaturesProps {
  t: Dictionary['features'];
}

export function Features({ t }: FeaturesProps) {
  const visuals = [
    <ProgramTypesVisual key="programs"   t={t.visuals.programTypes} />,
    <EngagementVisual   key="engagement" t={t.visuals.engagement} />,
    <GrowthVisual       key="growth"     t={t.visuals.growth} />,
    <WhatsAppVisual     key="whatsapp"   t={t.visuals.whatsapp} />,
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
