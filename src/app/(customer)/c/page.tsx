/**
 * Customer portal page — /c?code=XXXX-XXXX&tab=points|rewards|history
 *
 * Server component. No authentication — the access code IS the credential.
 * Tenant is resolved from x-tenant-subdomain (injected by middleware).
 *
 * Tabs use URL search params so every state is shareable / back-button safe.
 */

import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import CodeEntryForm from './CodeEntryForm';
import { getPortalData, getTenantBySubdomainPublic } from '@/modules/portal';
import { NotFoundError, TenantNotFoundError } from '@/lib/middleware/errors';
import type {
  PortalData,
  PortalEnrollment,
  PortalTransaction,
  PortalVoucher,
  PortalReward,
} from '@/modules/portal';

export const dynamic = 'force-dynamic';

// ── Props ─────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ code?: string; tab?: string }>;
}

type Tab = 'points' | 'rewards' | 'history';

// ── Page ──────────────────────────────────────────────────────────────

export default async function CustomerPortalPage({ searchParams }: PageProps) {
  const headersList = await headers();
  const subdomain = headersList.get('x-tenant-subdomain');

  const { code: rawCode, tab: rawTab } = await searchParams;
  const code = rawCode?.toUpperCase().trim();
  const tab: Tab = (rawTab === 'rewards' || rawTab === 'history') ? rawTab : 'points';

  // ── No tenant context ─────────────────────────────────────────────
  if (!subdomain) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-2xl border bg-white p-8 shadow-sm text-center">
          <p className="text-2xl mb-3">🔍</p>
          <h1 className="text-lg font-bold text-gray-900">No business found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This page must be accessed via a business&apos;s loyalty link.
          </p>
        </div>
      </div>
    );
  }

  // ── No code → show entry form ──────────────────────────────────────
  if (!code) {
    let tenantName: string | undefined;
    let primaryColor: string | undefined;
    try {
      const tenant = await getTenantBySubdomainPublic(subdomain);
      tenantName = tenant.name;
    } catch {
      // Tenant not found — handled gracefully
    }
    return <EntryScreen tenantName={tenantName} primaryColor={primaryColor} />;
  }

  // ── Resolve tenant and fetch portal data ─────────────────────────
  let data: PortalData;

  try {
    const tenant = await getTenantBySubdomainPublic(subdomain);
    data = await getPortalData(tenant.id, code);
  } catch (err) {
    if (err instanceof TenantNotFoundError) notFound();
    if (err instanceof NotFoundError) {
      return (
        <EntryScreen
          error="That code wasn't found. Double-check it and try again."
          primaryColor={undefined}
          tenantName={undefined}
        />
      );
    }
    throw err;
  }

  return <PortalShell data={data} code={code} tab={tab} />;
}

// ── Entry screen ──────────────────────────────────────────────────────

function EntryScreen({
  tenantName,
  primaryColor,
  error,
}: {
  tenantName?: string;
  primaryColor?: string;
  error?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-4xl mb-3">🎁</p>
          <h1 className="text-xl font-bold text-gray-900">
            {tenantName ? `${tenantName} Rewards` : 'Your Loyalty Rewards'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">Enter your access code to view your card.</p>
        </div>
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <CodeEntryForm error={error} primaryColor={primaryColor} />
        </div>
      </div>
    </div>
  );
}

// ── Portal shell (header + tabs + content) ────────────────────────────

function PortalShell({ data, code, tab }: { data: PortalData; code: string; tab: Tab }) {
  const { tenant, customer, enrollments, recent_transactions, pending_vouchers } = data;

  const tabHref = (t: Tab) => `?code=${code}&tab=${t}`;

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#F8FAFC' }}>

      {/* ── Gradient header ──────────────────────────────────────── */}
      <header
        className="px-4 pt-6 pb-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${tenant.primary_color} 0%, ${tenant.secondary_color} 100%)`,
        }}
      >
        <div className="mx-auto max-w-lg">
          <p className="text-xs font-semibold uppercase tracking-widest opacity-75">
            {tenant.name}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{customer.name}</h1>
          <p className="mt-0.5 font-mono text-sm opacity-70">{customer.access_code}</p>
          {tenant.welcome_message && (
            <p className="mt-2 text-sm opacity-85">{tenant.welcome_message}</p>
          )}
        </div>
      </header>

      {/* ── Tab bar (sticky top below header) ───────────────────── */}
      <div className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-lg">
          {([
            { key: 'points',  label: 'Points',  icon: '⭐' },
            { key: 'rewards', label: 'Rewards', icon: '🎁' },
            { key: 'history', label: 'History', icon: '📋' },
          ] as { key: Tab; label: string; icon: string }[]).map(({ key, label, icon }) => (
            <Link
              key={key}
              href={tabHref(key)}
              className={`flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-semibold transition-colors ${
                tab === key
                  ? 'border-b-2 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              style={tab === key ? { borderColor: tenant.primary_color, color: tenant.primary_color } : {}}
            >
              <span className="text-base leading-none">{icon}</span>
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── Tab content ──────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-lg flex-1 space-y-4 px-4 py-5">

        {tab === 'points' && (
          <PointsTab
            enrollments={enrollments}
            pendingVouchers={pending_vouchers}
            tenant={tenant}
            customer={customer}
          />
        )}

        {tab === 'rewards' && (
          <RewardsTab
            enrollments={enrollments}
            tenant={tenant}
          />
        )}

        {tab === 'history' && (
          <HistoryTab
            transactions={recent_transactions}
            tenant={tenant}
          />
        )}

      </main>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <p className="pb-6 text-center text-xs text-gray-300">
        Member since {new Date(customer.member_since).toLocaleDateString('en', { year: 'numeric', month: 'long' })}
      </p>
    </div>
  );
}

// ── POINTS TAB ────────────────────────────────────────────────────────

function PointsTab({
  enrollments,
  pendingVouchers,
  tenant,
  customer,
}: {
  enrollments: PortalEnrollment[];
  pendingVouchers: PortalVoucher[];
  tenant: PortalData['tenant'];
  customer: PortalData['customer'];
}) {
  const affordableCount = enrollments.reduce(
    (sum, e) => sum + e.rewards.filter((r) => r.is_affordable).length,
    0,
  );

  return (
    <>
      {/* Pending vouchers */}
      {pendingVouchers.length > 0 && (
        <section className="space-y-3">
          <SectionHeading>Ready to Use 🎉</SectionHeading>
          {pendingVouchers.map((v) => (
            <VoucherCard key={v.id} voucher={v} primaryColor={tenant.primary_color} />
          ))}
        </section>
      )}

      {/* Affordable callout */}
      {affordableCount > 0 && pendingVouchers.length === 0 && (
        <div
          className="rounded-2xl p-4 text-sm font-medium"
          style={{ backgroundColor: `${tenant.primary_color}15`, color: tenant.primary_color }}
        >
          🎁 You can redeem {affordableCount} reward{affordableCount !== 1 ? 's' : ''}! Check the Rewards tab.
        </div>
      )}

      {/* Enrollment cards */}
      {enrollments.length > 0 ? (
        <section className="space-y-3">
          <SectionHeading>Your Programs</SectionHeading>
          {enrollments.map((e) => (
            <EnrollmentCard
              key={e.program_id}
              enrollment={e}
              primaryColor={tenant.primary_color}
              programLabel={tenant.program_label}
            />
          ))}
        </section>
      ) : (
        <EmptyState
          icon="🌱"
          title="No programs yet"
          message={`Ask ${tenant.name} to enroll you in a loyalty program.`}
        />
      )}
    </>
  );
}

// ── REWARDS TAB ───────────────────────────────────────────────────────

function RewardsTab({
  enrollments,
  tenant,
}: {
  enrollments: PortalEnrollment[];
  tenant: PortalData['tenant'];
}) {
  const allRewards = enrollments.flatMap((e) =>
    e.rewards.map((r) => ({ ...r, programName: e.program_name, currentPoints: e.current_points }))
  );

  if (allRewards.length === 0) {
    return (
      <EmptyState
        icon="🎁"
        title="No rewards yet"
        message="Your business hasn't added any rewards to this program yet."
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
            <div className="overflow-hidden rounded-2xl border bg-white shadow-sm divide-y divide-gray-50">
              {e.rewards.map((r) => (
                <RewardRow
                  key={r.id}
                  reward={r}
                  primaryColor={tenant.primary_color}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

function RewardRow({
  reward: r,
  primaryColor,
}: {
  reward: PortalReward;
  primaryColor: string;
}) {
  const amountNeeded = Math.max(0, r.progress_total - r.progress_current);
  const progressPct  = r.progress_total > 0
    ? Math.min(100, (r.progress_current / r.progress_total) * 100)
    : 0;

  return (
    <div className={`flex items-start gap-3 px-4 py-4 ${!r.is_affordable ? 'opacity-75' : ''}`}>
      {/* Lock / unlock icon */}
      <div
        className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={
          r.is_affordable
            ? { backgroundColor: `${primaryColor}18`, color: primaryColor }
            : { backgroundColor: '#F3F4F6', color: '#9CA3AF' }
        }
      >
        {r.is_out_of_stock ? '🚫' : r.is_affordable ? '✓' : '🔒'}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-gray-800">{r.name}</p>
          <p
            className="shrink-0 font-mono text-xs font-semibold"
            style={{ color: r.is_affordable ? primaryColor : '#6B7280' }}
          >
            {r.progress_total.toLocaleString()} {r.progress_label}
          </p>
        </div>

        {r.description && (
          <p className="mt-0.5 text-xs text-gray-400">{r.description}</p>
        )}

        {r.is_out_of_stock && (
          <p className="mt-1 text-xs font-medium text-red-400">Out of stock</p>
        )}

        {!r.is_affordable && !r.is_out_of_stock && (
          <>
            <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${progressPct}%`, backgroundColor: primaryColor }}
              />
            </div>
            <p className="mt-1 text-xs text-gray-400">
              {amountNeeded.toLocaleString()} more {r.progress_label} needed
            </p>
          </>
        )}

        {r.is_affordable && (
          <p className="mt-1 text-xs font-medium" style={{ color: primaryColor }}>
            Ready to redeem — ask staff!
          </p>
        )}

        {r.expiry_days && (
          <p className="mt-0.5 text-xs text-gray-400">Voucher expires in {r.expiry_days} days</p>
        )}
      </div>
    </div>
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
        icon="📋"
        title="No transactions yet"
        message="Your activity will appear here after your first visit."
      />
    );
  }

  return (
    <section className="space-y-2">
      <SectionHeading>Recent Activity</SectionHeading>
      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm divide-y divide-gray-50">
        {transactions.map((tx) => (
          <TransactionRow key={tx.id} tx={tx} programLabel={tenant.program_label} primaryColor={tenant.primary_color} />
        ))}
      </div>
    </section>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400">{children}</h2>
  );
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <div className="rounded-2xl border bg-white p-10 text-center shadow-sm">
      <p className="text-3xl mb-2">{icon}</p>
      <p className="font-semibold text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ── Enrollment card (Points tab) ──────────────────────────────────────

function EnrollmentCard({
  enrollment: e,
  primaryColor,
  programLabel,
}: {
  enrollment: PortalEnrollment;
  primaryColor: string;
  programLabel: string;
}) {
  const affordableRewards = e.rewards.filter((r) => r.is_affordable);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-gray-900">{e.program_name}</h3>
          <p className="text-xs text-gray-400 capitalize">{e.program_type} program</p>
        </div>
        <ProgramBadge type={e.program_type} primaryColor={primaryColor} />
      </div>

      <div className="mt-4">
        {e.program_type === 'stamp' && (
          <StampGrid count={e.stamp_count} config={e.program_config} primaryColor={primaryColor} />
        )}
        {e.program_type === 'visit' && (
          <VisitCounter count={e.visit_count} config={e.program_config} primaryColor={primaryColor} />
        )}
        {(e.program_type === 'points' || e.program_type === 'cashback') && (
          <PointsDisplay
            current={e.current_points}
            lifetime={e.lifetime_points}
            label={programLabel}
            primaryColor={primaryColor}
            config={e.program_config}
          />
        )}
      </div>

      {affordableRewards.length > 0 && (
        <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: `${primaryColor}12` }}>
          <p className="text-xs font-semibold mb-2" style={{ color: primaryColor }}>
            You can redeem:
          </p>
          <ul className="space-y-1">
            {affordableRewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{r.name}</span>
                <span className="font-mono text-xs text-gray-400">
                  {r.progress_total.toLocaleString()} {r.progress_label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Stamp grid ────────────────────────────────────────────────────────

function StampGrid({
  count,
  config,
  primaryColor,
}: {
  count: number;
  config: Record<string, unknown>;
  primaryColor: string;
}) {
  const total = typeof config.stamps_needed === 'number' ? config.stamps_needed : 10;
  const filled = Math.min(count, total);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-8 w-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all"
            style={
              i < filled
                ? { backgroundColor: primaryColor, borderColor: primaryColor, color: '#fff' }
                : { borderColor: '#E5E7EB', color: '#D1D5DB' }
            }
          >
            {i < filled ? '✓' : ''}
          </div>
        ))}
      </div>
      <p className="mt-2 text-sm text-gray-500">
        {filled} / {total} stamps collected
        {filled >= total && (
          <span className="ml-1 font-semibold text-green-600">— Card complete! 🎉</span>
        )}
      </p>
    </div>
  );
}

// ── Visit counter ─────────────────────────────────────────────────────

function VisitCounter({
  count,
  config,
  primaryColor,
}: {
  count: number;
  config: Record<string, unknown>;
  primaryColor: string;
}) {
  const visitsNeeded = typeof config.visits_needed === 'number' ? config.visits_needed : null;
  const progressPct = visitsNeeded ? Math.min(100, (count / visitsNeeded) * 100) : null;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold" style={{ color: primaryColor }}>{count}</span>
        <span className="text-sm text-gray-400">total visits</span>
      </div>
      {visitsNeeded && progressPct !== null && (
        <>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progressPct}%`, backgroundColor: primaryColor }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {count >= visitsNeeded
              ? 'Reward unlocked!'
              : `${visitsNeeded - count} more visit${visitsNeeded - count !== 1 ? 's' : ''} until your reward`}
          </p>
        </>
      )}
    </div>
  );
}

// ── Points display ────────────────────────────────────────────────────

function PointsDisplay({
  current,
  lifetime,
  label,
  primaryColor,
  config,
}: {
  current: number;
  lifetime: number;
  label: string;
  primaryColor: string;
  config: Record<string, unknown>;
}) {
  const minRedeem = typeof config.min_redeem === 'number' ? config.min_redeem : null;
  const progress = minRedeem ? Math.min((current / minRedeem) * 100, 100) : null;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold" style={{ color: primaryColor }}>
          {current.toLocaleString()}
        </span>
        <span className="text-sm text-gray-400">{label}</span>
      </div>

      {progress !== null && minRedeem !== null && (
        <div className="mt-2">
          <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, backgroundColor: primaryColor }}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            {current >= minRedeem
              ? 'You have enough to redeem!'
              : `${(minRedeem - current).toLocaleString()} more ${label} until you can redeem`}
          </p>
        </div>
      )}

      <p className="mt-1.5 text-xs text-gray-300">
        {lifetime.toLocaleString()} {label} earned all-time
      </p>
    </div>
  );
}

// ── Program badge ─────────────────────────────────────────────────────

function ProgramBadge({
  type,
  primaryColor,
}: {
  type: PortalEnrollment['program_type'];
  primaryColor: string;
}) {
  const icons: Record<PortalEnrollment['program_type'], string> = {
    points: '⭐',
    stamp: '🎟️',
    visit: '📍',
    cashback: '💰',
  };
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
    >
      {icons[type]}
    </span>
  );
}

// ── Voucher card ──────────────────────────────────────────────────────

function VoucherCard({
  voucher: v,
  primaryColor,
}: {
  voucher: PortalVoucher;
  primaryColor: string;
}) {
  const expiresAt = v.expires_at ? new Date(v.expires_at) : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div
      className="rounded-2xl border-2 p-4 shadow-sm"
      style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: primaryColor }}>
            Voucher · Ready to use
          </p>
          <p className="mt-0.5 font-bold text-gray-900">{v.reward_name}</p>
          {daysLeft !== null && (
            <p className={`mt-0.5 text-xs ${daysLeft <= 3 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
              {daysLeft > 0 ? `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}` : 'Expires today'}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 rounded-xl bg-white border border-dashed px-4 py-2 text-center" style={{ borderColor: primaryColor }}>
        <p className="font-mono text-lg font-bold tracking-widest text-gray-900">
          {v.redemption_code}
        </p>
        <p className="mt-0.5 text-xs text-gray-400">Show this to staff</p>
      </div>
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────

const TX_ICONS: Record<string, string> = {
  earn:       '➕',
  redeem:     '🎁',
  adjustment: '✏️',
  adjust:     '✏️',
  expire:     '⏰',
  refund:     '↩️',
};

const TX_LABELS: Record<string, string> = {
  earn:       'Earned',
  redeem:     'Redeemed',
  adjustment: 'Adjusted',
  adjust:     'Adjusted',
  expire:     'Expired',
  refund:     'Refunded',
};

function TransactionRow({
  tx,
  programLabel,
  primaryColor,
}: {
  tx: PortalTransaction;
  programLabel: string;
  primaryColor: string;
}) {
  const isEarn = tx.points_delta > 0;
  const date = new Date(tx.created_at);
  const formattedDate = date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm"
        style={{ backgroundColor: isEarn ? `${primaryColor}15` : '#FEF2F2' }}
      >
        {TX_ICONS[tx.type] ?? '•'}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {tx.note ?? TX_LABELS[tx.type] ?? tx.type}
        </p>
        <p className="text-xs text-gray-400">
          {tx.program_name} · {formattedDate}, {formattedTime}
        </p>
      </div>
      <span
        className={`shrink-0 font-mono text-sm font-bold ${
          isEarn ? 'text-green-600' : 'text-gray-400'
        }`}
      >
        {isEarn ? '+' : ''}{tx.points_delta.toLocaleString()} {programLabel}
      </span>
    </div>
  );
}
