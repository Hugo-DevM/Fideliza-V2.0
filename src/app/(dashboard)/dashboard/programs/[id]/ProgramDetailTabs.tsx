'use client';

import { useState, useEffect, useRef } from 'react';
import FlashOfferCard from './FlashOfferCard';
import SurpriseDelightCard from './SurpriseDelightCard';
import ReferralCard from './ReferralCard';
import ChallengesCard from './ChallengesCard';
import NewRewardForm from './NewRewardForm';
import DeleteRewardButton from './DeleteRewardButton';
import Link from 'next/link';

interface Challenge {
  id: string; title: string; target: number;
  bonus_points: number; ends_at: string | null; is_active: boolean;
}

interface RewardItem {
  id: string; name: string; cost_points: number; is_active: boolean;
  redeemed_count: number; stock: number | null; expiry_days: number | null;
}

interface RecentTx {
  id: string; type: string; points_delta: number;
  note: string | null; created_at: string;
  customers: { name: string } | null;
}

interface Props {
  initialTab:     string;
  programId:      string;
  programType:    string;
  effectivePlan:  string;
  config:         Record<string, unknown>;
  challenges:     Challenge[];
  rewards:        RewardItem[];
  recentTx:       RecentTx[];
  txTotal:        number;
  programLabel:   string;
  rewardCatalog:  boolean;
  maxRewardsPerProgram: number | null;
}

const AVATAR_COLORS = ['bg-indigo-500','bg-violet-500','bg-emerald-500','bg-amber-500','bg-rose-500','bg-cyan-500'];

function formatAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `hace ${hrs} h`;
  return `hace ${Math.floor(hrs / 24)} d`;
}

function rewardCostLabel(type: string, costPoints: number, config: Record<string, unknown>): string {
  if (type === 'stamp')    return `${config.stamps_needed ?? costPoints} sellos`;
  if (type === 'visit')    return `${config.visits_needed ?? costPoints} visitas`;
  if (type === 'cashback') return `${costPoints} pts`;
  return `${costPoints} pts`;
}

export default function ProgramDetailTabs({
  initialTab, programId, programType, effectivePlan, config,
  challenges, rewards, recentTx, txTotal, programLabel,
  rewardCatalog, maxRewardsPerProgram,
}: Props) {
  const [activeTab, setActiveTab]   = useState(initialTab);
  const [visible,   setVisible]     = useState(true);
  const pendingTab  = useRef<string | null>(null);

  function switchTab(tab: string) {
    if (tab === activeTab) return;
    pendingTab.current = tab;
    setVisible(false);
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

  const activeRewards = rewards.filter((r) => r.is_active);
  const atLimit = maxRewardsPerProgram !== null && activeRewards.length >= maxRewardsPerProgram;

  return (
    <>
      {/* Tab nav */}
      <div className="flex gap-1 rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-1">
        {(['programa', 'retencion'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => switchTab(tab)}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-medium text-center transition-colors ${
              activeTab === tab
                ? 'bg-gray-100 dark:bg-[#1e2438] text-gray-900 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab === 'programa' ? 'Programa' : 'Retención'}
          </button>
        ))}
      </div>

      {/* Animated content */}
      <div
        style={{
          opacity:    visible ? 1 : 0,
          transform:  visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 180ms ease, transform 180ms ease',
        }}
      >
        {/* Retención tab */}
        {activeTab === 'retencion' && (
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
            <FlashOfferCard programId={programId} plan={effectivePlan} programType={programType} config={config} />
            <SurpriseDelightCard programId={programId} plan={effectivePlan} config={config} />
            <ReferralCard programId={programId} plan={effectivePlan} config={config} />
            <ChallengesCard programId={programId} plan={effectivePlan} challenges={challenges} />
          </div>
        )}

        {/* Programa tab */}
        {activeTab === 'programa' && (
          <div className="grid gap-4 lg:grid-cols-2 lg:items-start">

            {/* Reward catalog */}
            <div className="min-h-[220px] rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Catálogo de recompensas</h2>
                {rewardCatalog && !atLimit && (
                  <NewRewardForm
                    programId={programId}
                    programType={programType as 'points' | 'stamp' | 'visit' | 'cashback'}
                    programConfig={config}
                    compact
                  />
                )}
                {rewardCatalog && atLimit && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">Límite: {maxRewardsPerProgram} activas</span>
                )}
              </div>

              {activeRewards.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin recompensas aún.</p>
              )}

              {activeRewards.length > 0 && (
                <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                  {activeRewards.map((r) => (
                    <li key={r.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400">
                        <RewardIcon type={programType} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-gray-800 dark:text-white">{r.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {r.redeemed_count} canjes
                          {r.stock !== null && ` · stock: ${r.stock}`}
                          {r.expiry_days && ` · vence en ${r.expiry_days}d`}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-indigo-50 dark:bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                        {rewardCostLabel(programType, r.cost_points, config)}
                      </span>
                      <DeleteRewardButton programId={programId} rewardId={r.id} rewardName={r.name} />
                    </li>
                  ))}
                </ul>
              )}

              {!rewardCatalog && (
                <div className="mx-5 mb-5 mt-3 rounded-xl border border-dashed border-amber-300 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 p-4 text-center">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-300">El catálogo de recompensas requiere el plan Starter o Pro</p>
                  <a href="/dashboard/settings" className="mt-1 inline-block text-xs text-amber-700 dark:text-amber-400 underline hover:text-amber-900">
                    Actualizar plan
                  </a>
                </div>
              )}
            </div>

            {/* Recent transactions */}
            <div className="min-h-[220px] rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
                <h2 className="text-sm font-semibold text-gray-800 dark:text-white">Transacciones recientes</h2>
                {txTotal > 0 && <span className="text-xs text-gray-400 dark:text-gray-500">{txTotal} en total</span>}
              </div>
              {recentTx.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-gray-400 dark:text-gray-500">Sin transacciones aún.</p>
              ) : (
                <>
                  <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
                    {recentTx.map((tx) => {
                      const name     = tx.customers?.name ?? '—';
                      const delta    = tx.points_delta;
                      const isPos    = delta > 0;
                      const initials = name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
                      const color    = AVATAR_COLORS[initials.charCodeAt(0) % AVATAR_COLORS.length];
                      const ago      = formatAgo(new Date(tx.created_at));
                      const action   = isPos
                        ? `ganó ${delta} ${programLabel}`
                        : tx.note ? `canjeó ${tx.note}` : `canjeó ${Math.abs(delta)} pts`;
                      return (
                        <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-white ${color}`}>
                            {initials}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-gray-800 dark:text-gray-100">
                              <span className="font-semibold">{name}</span>{' '}
                              <span className="text-gray-500 dark:text-gray-400 font-normal">{action}</span>
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{ago}</p>
                          </div>
                          <span className={`shrink-0 text-sm font-semibold ${isPos ? 'text-emerald-500' : 'text-gray-400 dark:text-gray-500'}`}>
                            {isPos ? `+${delta}` : delta} pts
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  {txTotal > 5 && (
                    <div className="border-t border-gray-100 dark:border-[#1e2438] px-5 py-3">
                      <Link
                        href={`/dashboard/programs/${programId}/transactions`}
                        className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition"
                      >
                        Ver todas las transacciones
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function RewardIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'points' || type === 'cashback') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0c1.1.128 1.907 1.077 1.907 2.185Z" />
    </svg>
  );
  if (type === 'stamp') return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}
