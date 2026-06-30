'use client';

import { useState, useRef, useEffect } from 'react';
import VoucherCard from './VoucherCard';
import RedeemButton from './RedeemButton';
import ReferralShareButton from './ReferralShareButton';
import { computeTier, nextTier, TIER_STYLES } from '@/lib/utils/tiers';
import type { TierConfig } from '@/lib/utils/tiers';
import type {
  PortalData,
  PortalEnrollment,
  PortalTransaction,
  PortalVoucher,
  PortalReward,
  PortalChallenge,
  PortalMission,
  PortalProgramRanking,
} from '@/modules/portal';

type Tab = 'points' | 'rewards' | 'history' | 'ranking';

const ACCENT = '#6366F1';

const LIFETIME_METRIC: Record<string, string> = {
  points:   'puntos acumulados',
  stamp:    'sellos acumulados',
  visit:    'visitas acumuladas',
  cashback: 'cashback acumulado',
};

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

const TX_LABEL: Record<string, string> = {
  earn:       'Ganado',
  stamp:      'Sello',
  redeem:     'Canjeado',
  adjustment: 'Ajustado',
  adjust:     'Ajustado',
  expire:     'Expirado',
  refund:     'Reembolsado',
};

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  points: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  ),
  rewards: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  ),
  history: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  ),
  ranking: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0" />
    </svg>
  ),
};

const TAB_LABELS: Record<Tab, string> = {
  points:  'Puntos',
  rewards: 'Recompensas',
  history: 'Historial',
  ranking: 'Ranking',
};

// ── Main component ────────────────────────────────────────────────────

export default function PortalTabsClient({
  data,
  code,
  initialTab,
}: {
  data: PortalData;
  code: string;
  initialTab: Tab;
}) {
  const { tenant, customer, enrollments, recent_transactions, pending_vouchers, rankings } = data;

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [visible,   setVisible]   = useState(true);
  const pendingTab  = useRef<Tab | null>(null);

  function switchTab(tab: Tab) {
    if (tab === activeTab) return;
    pendingTab.current = tab;
    setVisible(false);
    window.history.pushState(null, '', `?code=${code}&tab=${tab}`);
  }

  useEffect(() => {
    if (!visible && pendingTab.current) {
      const t = setTimeout(() => {
        setActiveTab(pendingTab.current!);
        pendingTab.current = null;
        setVisible(true);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [visible]);

  return (
    <>
      {/* ── Tab bar ────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-[#0f1222] px-4 py-2">
        <div className="mx-auto max-w-lg flex gap-1 rounded-2xl bg-gray-100 dark:bg-[#1a1f35] p-1">
          {((['points', 'rewards', 'history', 'ranking'] as Tab[])).map((key) => {
            const active = activeTab === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => switchTab(key)}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold rounded-xl transition-colors ${
                  active ? 'text-white' : 'text-gray-400 dark:text-gray-500'
                }`}
                style={active ? { backgroundColor: ACCENT } : {}}
              >
                {TAB_ICONS[key]}
                {TAB_LABELS[key]}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab content with fade animation ────────────────────────── */}
      <main
        className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-5"
        style={{
          opacity:   visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 150ms ease, transform 150ms ease',
        }}
      >
        {activeTab === 'points' && (
          <PointsTab
            enrollments={enrollments}
            pendingVouchers={pending_vouchers}
            tenant={tenant}
            customer={customer}
            tenantTiers={data.tenant_tiers}
            referralEnabled={data.referral_enabled}
            referralProgramConfigs={data.referral_program_configs}
            missions={data.missions}
          />
        )}
        {activeTab === 'rewards' && (
          <RewardsTab
            enrollments={enrollments}
            tenant={tenant}
            customerId={customer.id}
          />
        )}
        {activeTab === 'history' && (
          <HistoryTab
            transactions={recent_transactions}
            tenant={tenant}
          />
        )}
        {activeTab === 'ranking' && (
          <RankingTab
            rankings={rankings}
            customer={customer}
          />
        )}
      </main>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <p className="pb-8 text-center text-xs text-gray-400 dark:text-gray-600">
        Miembro desde {new Date(customer.member_since).toLocaleDateString('es', { year: 'numeric', month: 'long' })}
      </p>
    </>
  );
}

// ── POINTS TAB ────────────────────────────────────────────────────────

function PointsTab({
  enrollments,
  pendingVouchers,
  tenant,
  customer,
  tenantTiers,
  referralEnabled,
  referralProgramConfigs,
  missions,
}: {
  enrollments: PortalEnrollment[];
  pendingVouchers: PortalVoucher[];
  tenant: PortalData['tenant'];
  customer: PortalData['customer'];
  tenantTiers: PortalData['tenant_tiers'];
  referralEnabled: boolean;
  referralProgramConfigs: Record<string, { referrer_bonus: number; referred_bonus: number }>;
  missions: PortalMission[];
}) {
  const affordableCount = enrollments.reduce(
    (sum, e) => sum + e.rewards.filter((r) => r.is_affordable).length,
    0,
  );

  const referralPrograms = referralEnabled
    ? enrollments.filter((e) => referralProgramConfigs[e.program_id] !== undefined)
    : [];

  return (
    <>
      {/* Universal VIP Tier badge */}
      {tenantTiers && tenantTiers.length > 0 && (() => {
        const currentTier = computeTier(customer.loyalty_score, tenantTiers as TierConfig[]);
        const upcoming    = nextTier(customer.loyalty_score, tenantTiers as TierConfig[]);
        if (!currentTier) return null;
        const style  = TIER_STYLES[currentTier.color] ?? TIER_STYLES.bronze;
        const medal  = currentTier.color === 'gold' ? '🥇' : currentTier.color === 'silver' ? '🥈' : '🥉';
        const pct    = upcoming
          ? Math.min(100, Math.round((customer.loyalty_score - currentTier.min_lifetime) / (upcoming.min_lifetime - currentTier.min_lifetime) * 100))
          : 100;
        return (
          <div className={`rounded-2xl border px-4 py-3 space-y-2 ${style.bg} ${style.border}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{medal}</span>
                <div>
                  <p className={`text-sm font-bold ${style.text}`}>{currentTier.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{customer.loyalty_score.toLocaleString()} pts de lealtad</p>
                </div>
              </div>
              {currentTier.multiplier > 1 && (
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${style.bg} ${style.border} ${style.text} border`}>
                  {currentTier.multiplier}× earn
                </span>
              )}
            </div>
            {upcoming && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                  <span>Siguiente: {upcoming.label}</span>
                  <span>{(upcoming.min_lifetime - customer.loyalty_score).toLocaleString()} pts restantes</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-[#2a3147]">
                  <div
                    className={`h-1.5 rounded-full transition-all ${style.text.replace('text-', 'bg-').split(' ')[0]}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )}
            {!upcoming && (
              <p className={`text-xs font-medium ${style.text}`}>Nivel máximo alcanzado 🏆</p>
            )}
          </div>
        );
      })()}

      {/* Pending vouchers */}
      {pendingVouchers.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Listo para usar</SectionHeading>
          {pendingVouchers.map((v) => (
            <VoucherCard key={v.id} voucher={v} primaryColor={ACCENT} />
          ))}
        </section>
      )}

      {/* Affordable callout */}
      {affordableCount > 0 && pendingVouchers.length === 0 && (
        <div className="rounded-2xl p-4 flex items-center gap-3 bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
          <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
          </svg>
          <p className="text-sm font-semibold">
            ¡Puedes canjear {affordableCount} recompensa{affordableCount !== 1 ? 's' : ''}! Revisa la pestaña Recompensas.
          </p>
        </div>
      )}

      {/* Missions */}
      {missions.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Misiones</SectionHeading>
          <div className="space-y-3">
            {missions.map((m) => (
              <ChallengeRow key={m.id} challenge={m} programType={m.program_type} />
            ))}
          </div>
        </section>
      )}

      {/* Enrollment cards */}
      {enrollments.length > 0 ? (
        <section className="space-y-3">
          <SectionHeading>Tus Programas</SectionHeading>
          {enrollments.map((e) => (
            <EnrollmentCard
              key={e.program_id}
              enrollment={e}
              primaryColor={ACCENT}
              programLabel={tenant.program_label}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          type="programs"
          title="Sin programas aún"
          message={`Pide a ${tenant.name} que te inscriba en un programa de lealtad.`}
        />
      )}

      {/* Referral cards */}
      {referralPrograms.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Invita amigos</SectionHeading>
          {referralPrograms.map((e) => (
            <ReferralShareCard
              key={e.program_id}
              enrollment={e}
              referralCode={customer.referral_code ?? ''}
              tenantSubdomain={tenant.subdomain}
              programConfig={referralProgramConfigs[e.program_id]}
            />
          ))}
        </section>
      )}
    </>
  );
}

// ── REWARDS TAB ───────────────────────────────────────────────────────

function RewardsTab({
  enrollments,
  tenant,
  customerId,
}: {
  enrollments: PortalEnrollment[];
  tenant: PortalData['tenant'];
  customerId: string;
}) {
  const allRewards = enrollments.flatMap((e) => e.rewards);

  if (allRewards.length === 0) {
    return (
      <EmptyState
        type="rewards"
        title="Sin recompensas aún"
        message="El negocio no ha agregado recompensas a este programa aún."
      />
    );
  }

  return (
    <>
      {enrollments.map((e) => {
        if (!e.rewards.length) return null;
        return (
          <section key={e.program_id} className="space-y-2">
            <SectionHeading>{e.program_name}</SectionHeading>
            <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm divide-y divide-gray-50 dark:divide-[#1e2438]">
              {e.rewards.map((r) => (
                <RewardRow
                  key={r.id}
                  reward={r}
                  primaryColor={ACCENT}
                  tenantId={tenant.id}
                  customerId={customerId}
                  enrollmentId={e.enrollment_id}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

// ── HISTORY TAB ───────────────────────────────────────────────────────

function HistoryTab({
  transactions,
  tenant,
}: {
  transactions: PortalTransaction[];
  tenant: PortalData['tenant'];
}) {
  if (transactions.length === 0) {
    return (
      <EmptyState
        type="history"
        title="Sin transacciones aún"
        message="Tu actividad aparecerá aquí después de tu primera visita."
      />
    );
  }

  const shown = transactions.slice(0, 6);

  return (
    <section className="space-y-2">
      <SectionHeading>Actividad reciente</SectionHeading>
      <div className="overflow-hidden rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm divide-y divide-gray-50 dark:divide-[#1e2438]">
        {shown.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} programLabel={tenant.program_label} primaryColor={ACCENT} />
        ))}
      </div>
    </section>
  );
}

// ── RANKING TAB ───────────────────────────────────────────────────────

function RankingTab({
  rankings,
  customer,
}: {
  rankings: PortalProgramRanking[];
  customer: PortalData['customer'];
}) {
  if (rankings.length === 0) {
    return (
      <EmptyState
        type="history"
        title="Sin programas aún"
        message="Inscríbete en un programa de lealtad para ver tu posición en el ranking."
      />
    );
  }

  return (
    <div className="space-y-4">
      {rankings.map((r) => (
        <ProgramRankingCard key={r.program_id} ranking={r} customerName={customer.name} />
      ))}
    </div>
  );
}

function ProgramRankingCard({
  ranking: r,
  customerName,
}: {
  ranking: PortalProgramRanking;
  customerName: string;
}) {
  const metricLabel = LIFETIME_METRIC[r.program_type] ?? 'puntos acumulados';
  const selfInTop10 = r.top10.some((e) => e.is_self);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          {r.program_name}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 px-5 py-3 min-w-[72px]">
            <span className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
              #{r.customer_rank}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-indigo-400 dark:text-indigo-500 mt-0.5">
              tu lugar
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">{customerName}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              de {r.total_enrolled.toLocaleString()} cliente{r.total_enrolled !== 1 ? 's' : ''}
            </p>
            {r.customer_rank === 1 && (
              <p className="mt-1 text-xs font-semibold text-yellow-600 dark:text-yellow-400">¡Eres el cliente más leal! 🏆</p>
            )}
            {r.customer_rank <= 3 && r.customer_rank > 1 && (
              <p className="mt-1 text-xs font-semibold text-amber-600 dark:text-amber-400">¡Estás en el podio! {MEDAL[r.customer_rank]}</p>
            )}
            {r.customer_rank <= 10 && r.customer_rank > 3 && (
              <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">¡Estás en el top 10!</p>
            )}
          </div>
        </div>
      </div>

      {r.top10.length > 0 && (
        <div className="divide-y divide-gray-50 dark:divide-[#1e2438]">
          <p className="px-5 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Top {r.top10.length}
          </p>
          {r.top10.map((entry) => (
            <div
              key={entry.rank}
              className={`flex items-center gap-3 px-5 py-3 ${entry.is_self ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}
            >
              <div className="w-8 shrink-0 text-center">
                {MEDAL[entry.rank] ? (
                  <span className="text-lg">{MEDAL[entry.rank]}</span>
                ) : (
                  <span className="text-sm font-bold text-gray-400 dark:text-gray-500">#{entry.rank}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${entry.is_self ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-800 dark:text-gray-100'}`}>
                  {entry.display_name}
                  {entry.is_self && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wide opacity-70">tú</span>}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-mono text-sm font-semibold text-gray-600 dark:text-gray-300">{entry.lifetime_points.toLocaleString()}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500">{metricLabel}</p>
              </div>
            </div>
          ))}

          {!selfInTop10 && (
            <>
              <div className="px-5 py-1.5 text-center">
                <span className="text-[11px] text-gray-300 dark:text-gray-600">•••</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-500/10">
                <div className="w-8 shrink-0 text-center">
                  <span className="text-sm font-bold text-indigo-500 dark:text-indigo-400">#{r.customer_rank}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                    {customerName} <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">tú</span>
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{r.customer_lifetime_points.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{metricLabel}</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
      {children}
    </h2>
  );
}

function EmptyState({ type, title, message }: { type: 'programs' | 'rewards' | 'history'; title: string; message: string }) {
  const icons = {
    programs: (
      <svg className="h-7 w-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
      </svg>
    ),
    rewards: (
      <svg className="h-7 w-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    ),
    history: (
      <svg className="h-7 w-7 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] p-10 text-center shadow-sm">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/10">
        {icons[type]}
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-200">{title}</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">{message}</p>
    </div>
  );
}

function bonusLabel(type: string): string {
  if (type === 'visit')    return 'visitas';
  if (type === 'stamp')    return 'sellos';
  if (type === 'cashback') return 'bono $';
  return 'pts';
}

function ChallengeRow({ challenge: c, programType }: { challenge: PortalChallenge; programType: string }) {
  const unit      = bonusLabel(programType);
  const pct       = Math.min(100, Math.round((c.progress / c.target) * 100));
  const remaining = Math.max(0, c.target - c.progress);
  const done      = Boolean(c.completed_at);

  return (
    <div className={`rounded-xl px-4 py-3 ${done ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-gray-50 dark:bg-[#0d0f17]'}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p className={`text-sm font-semibold truncate ${done ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-800 dark:text-gray-100'}`}>
            {done && <span className="mr-1">✓</span>}{c.title}
          </p>
          {c.description && (
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{c.description}</p>
          )}
          {c.ends_at && !done && (
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              hasta {new Date(c.ends_at).toLocaleDateString('es', { day: 'numeric', month: 'short' })}
            </p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-bold rounded-full px-2 py-0.5 ${
          done
            ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'
            : 'bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-400'
        }`}>
          +{c.bonus_points} {unit}
        </span>
      </div>

      {!done && (
        <>
          <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-[#1e2438] overflow-hidden">
            <div className="h-full rounded-full bg-orange-400 dark:bg-orange-500 transition-all" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            {c.progress}/{c.target} {unit}
            {remaining > 0 && <> · faltan <strong className="text-gray-600 dark:text-gray-300">{remaining}</strong></>}
          </p>
        </>
      )}
    </div>
  );
}

function EnrollmentCard({ enrollment: e, primaryColor, programLabel }: {
  enrollment: PortalEnrollment;
  primaryColor: string;
  programLabel: string;
}) {
  const affordableRewards = e.rewards.filter((r) => r.is_affordable);
  const programTypeLabel: Record<PortalEnrollment['program_type'], string> = {
    points:   'Programa de puntos',
    stamp:    'Programa de sellos',
    visit:    'Programa de visitas',
    cashback: 'Programa de cashback',
  };

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{e.program_name}</h3>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{programTypeLabel[e.program_type]}</p>
        </div>
        <ProgramBadge type={e.program_type} primaryColor={primaryColor} />
      </div>

      <div className="mt-4">
        {e.program_type === 'stamp' && (
          <StampGrid count={e.stamp_count} config={e.program_config} primaryColor={primaryColor} firstRewardName={e.rewards[0]?.name} />
        )}
        {e.program_type === 'visit' && (
          <VisitCounter count={e.visit_count} config={e.program_config} primaryColor={primaryColor} />
        )}
        {(e.program_type === 'points' || e.program_type === 'cashback') && (
          <PointsDisplay current={e.current_points} lifetime={e.lifetime_points} label={programLabel} primaryColor={primaryColor} config={e.program_config} />
        )}
      </div>

      {affordableRewards.length > 0 && (
        <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: `${primaryColor}12` }}>
          <p className="text-xs font-semibold mb-2" style={{ color: primaryColor }}>Puedes canjear:</p>
          <ul className="space-y-1.5">
            {affordableRewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{r.name}</span>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">{r.progress_total.toLocaleString()} {r.progress_label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ProgramBadge({ type, primaryColor }: { type: PortalEnrollment['program_type']; primaryColor: string }) {
  const icons: Record<PortalEnrollment['program_type'], React.ReactNode> = {
    stamp: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.745 3.745 0 0 1 3.296-1.043A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
      </svg>
    ),
    points: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
    visit: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
      </svg>
    ),
    cashback: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  };
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>
      {icons[type]}
    </div>
  );
}

function StampGrid({ count, config, primaryColor, firstRewardName }: {
  count: number; config: Record<string, unknown>; primaryColor: string; firstRewardName?: string;
}) {
  const total    = typeof config.stamps_needed === 'number' ? config.stamps_needed : 10;
  const filled   = Math.min(count, total);
  const remaining = total - filled;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, i) =>
          i < filled ? (
            <div key={i} className="h-12 w-12 rounded-full flex items-center justify-center shadow-sm" style={{ backgroundColor: primaryColor }}>
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.745 3.745 0 0 1 3.296-1.043A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
              </svg>
            </div>
          ) : (
            <div key={i} className="h-12 w-12 rounded-full border-2 border-dashed border-gray-200 dark:border-[#2a3147] flex items-center justify-center">
              <span className="text-base font-light text-gray-300 dark:text-gray-600">+</span>
            </div>
          )
        )}
      </div>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        {filled} / {total} sellos
        {filled < total && remaining > 0 && (
          <> · faltan <strong className="text-gray-900 dark:text-white">{remaining}</strong>
            {firstRewardName ? ` para ${firstRewardName.toLowerCase()}` : ' para completar'}</>
        )}
        {filled >= total && <span className="ml-1 font-semibold text-green-600 dark:text-green-400"> · ¡Tarjeta completa! 🎉</span>}
      </p>
    </div>
  );
}

function VisitCounter({ count, config, primaryColor }: { count: number; config: Record<string, unknown>; primaryColor: string }) {
  const visitsNeeded = typeof config.visits_needed === 'number' ? config.visits_needed : null;
  const progressPct  = visitsNeeded ? Math.min(100, (count / visitsNeeded) * 100) : null;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold" style={{ color: primaryColor }}>{count}</span>
        <span className="text-sm text-gray-400 dark:text-gray-500">visitas en total</span>
      </div>
      {visitsNeeded && progressPct !== null && (
        <>
          <div className="mt-2.5 h-2 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: primaryColor }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            {count >= visitsNeeded ? '¡Recompensa desbloqueada!' : `${visitsNeeded - count} visita${visitsNeeded - count !== 1 ? 's' : ''} más para tu recompensa`}
          </p>
        </>
      )}
    </div>
  );
}

function PointsDisplay({ current, lifetime, label, primaryColor, config }: {
  current: number; lifetime: number; label: string; primaryColor: string; config: Record<string, unknown>;
}) {
  const minRedeem = typeof config.min_redeem === 'number' ? config.min_redeem : null;
  const progress  = minRedeem ? Math.min((current / minRedeem) * 100, 100) : null;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold" style={{ color: primaryColor }}>{current.toLocaleString()}</span>
        <span className="text-sm text-gray-400 dark:text-gray-500">{label}</span>
      </div>
      {progress !== null && minRedeem !== null && (
        <div className="mt-2.5">
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {current >= minRedeem ? '¡Tienes suficiente para canjear!' : `Faltan ${(minRedeem - current).toLocaleString()} ${label} para tu próxima recompensa.`}
          </p>
        </div>
      )}
      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">{lifetime.toLocaleString()} {label} ganados en total</p>
    </div>
  );
}

function RewardRow({ reward: r, primaryColor, tenantId, customerId, enrollmentId }: {
  reward: PortalReward; primaryColor: string; tenantId: string; customerId: string; enrollmentId: string;
}) {
  const amountNeeded = Math.max(0, r.progress_total - r.progress_current);
  const progressPct  = r.progress_total > 0 ? Math.min(100, (r.progress_current / r.progress_total) * 100) : 0;

  if (r.is_affordable && !r.is_out_of_stock) {
    return (
      <div className="p-3">
        <div className="rounded-xl p-4" style={{ backgroundColor: `${primaryColor}12` }}>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-green-100 dark:bg-green-500/15 flex items-center justify-center">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-gray-900 dark:text-white">{r.name}</p>
                <p className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">{r.progress_total.toLocaleString()} {r.progress_label}</p>
              </div>
              {r.description && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.description}</p>}
            </div>
          </div>
          <RedeemButton tenantId={tenantId} customerId={customerId} rewardId={r.id} enrollmentId={enrollmentId} primaryColor={primaryColor} rewardName={r.name} />
          {r.expiry_days && <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">El voucher vence en {r.expiry_days} días</p>}
        </div>
      </div>
    );
  }

  if (r.is_out_of_stock) {
    return (
      <div className="flex items-start gap-3 px-4 py-4 opacity-60">
        <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gray-100 dark:bg-[#1e2438] flex items-center justify-center">
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-gray-800 dark:text-gray-100">{r.name}</p>
            <p className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">{r.progress_total.toLocaleString()} {r.progress_label}</p>
          </div>
          {r.description && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{r.description}</p>}
          <p className="mt-1 text-xs font-medium text-red-400">Sin stock</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 px-4 py-4">
      <div className="mt-0.5 h-9 w-9 shrink-0 rounded-full bg-gray-100 dark:bg-[#1e2438] flex items-center justify-center">
        <svg className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-semibold text-gray-800 dark:text-gray-100">{r.name}</p>
          <p className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">{r.progress_total.toLocaleString()} {r.progress_label}</p>
        </div>
        {r.description && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{r.description}</p>}
        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: primaryColor }} />
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Faltan {amountNeeded.toLocaleString()} {r.progress_label} para completar</p>
        {r.expiry_days && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">El voucher vence en {r.expiry_days} días</p>}
      </div>
    </div>
  );
}

function TransactionRow({ tx, programLabel, primaryColor }: { tx: PortalTransaction; programLabel: string; primaryColor: string }) {
  const isEarn     = tx.type === 'earn'  && tx.points_delta > 0;
  const isStamp    = tx.type === 'stamp' && tx.points_delta > 0;
  const isPositive = tx.points_delta > 0;

  const date      = new Date(tx.created_at);
  const today     = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dateLabel: string;
  if (date.toDateString() === today.toDateString()) {
    dateLabel = 'Hoy';
  } else if (date.toDateString() === yesterday.toDateString()) {
    dateLabel = 'Ayer';
  } else {
    dateLabel = date.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  }
  const timeLabel = date.toLocaleTimeString('es', { hour: 'numeric', minute: '2-digit', hour12: false });
  const typeLabel = TX_LABEL[tx.type] ?? tx.type;
  const absVal    = Math.abs(tx.points_delta);
  const sign      = tx.points_delta > 0 ? '+' : tx.points_delta < 0 ? '-' : '';
  const unit      = isStamp ? `sello${absVal !== 1 ? 's' : ''}` : programLabel;
  const amountStr = `${sign}${absVal.toLocaleString()} ${unit}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {isEarn ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/15">
          <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </div>
      ) : isStamp ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: `${primaryColor}18` }}>
          <svg className="h-4 w-4" style={{ color: primaryColor }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h12v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6Z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9h1.5a1.5 1.5 0 0 1 0 3H18" />
          </svg>
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-500/10">
          <svg className="h-4 w-4 text-indigo-400 dark:text-indigo-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
          </svg>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold">{typeLabel}</span>
          {tx.note && <span className="text-gray-500 dark:text-gray-400"> · {tx.note}</span>}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{tx.program_name} · {dateLabel} · {timeLabel}</p>
      </div>
      <span
        className={`shrink-0 font-mono text-sm font-bold ${!isPositive ? 'text-gray-400 dark:text-gray-500' : isEarn ? 'text-green-600 dark:text-green-400' : ''}`}
        style={isStamp ? { color: primaryColor } : {}}
      >
        {amountStr}
      </span>
    </div>
  );
}

function ReferralShareCard({ enrollment: e, referralCode, tenantSubdomain, programConfig }: {
  enrollment: PortalEnrollment;
  referralCode: string;
  tenantSubdomain: string;
  programConfig?: { referrer_bonus: number; referred_bonus: number };
}) {
  const referrerBonus = programConfig?.referrer_bonus ?? 100;
  const referredBonus = programConfig?.referred_bonus ?? 50;
  const referralPath  = `/c/refer?ref=${referralCode}&program=${e.program_id}`;

  return (
    <div className="rounded-2xl border border-emerald-100 dark:border-emerald-500/20 bg-white dark:bg-[#161b2e] p-5 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20">
          <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Invita amigos</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{e.program_name}</p>
        </div>
      </div>
      <div className="flex gap-3 mb-4 text-center">
        <div className="flex-1 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2">
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+{referrerBonus}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">pts para ti</p>
        </div>
        <div className="flex-1 rounded-xl bg-blue-50 dark:bg-blue-500/10 px-3 py-2">
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">+{referredBonus}</p>
          <p className="text-[10px] text-gray-500 dark:text-gray-400">pts para tu amigo</p>
        </div>
      </div>
      <ReferralShareButton path={referralPath} code={referralCode} />
    </div>
  );
}
