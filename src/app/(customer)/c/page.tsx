/**
 * Customer portal page — /c?code=XXXX-XXXX&tab=points|rewards|history
 *
 * Server component. No authentication — the access code IS the credential.
 * Tenant is resolved from x-tenant-subdomain (injected by middleware).
 */

import Link from 'next/link';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import CodeEntryForm from './CodeEntryForm';
import RedeemButton from './RedeemButton';
import AutoRefresh from './AutoRefresh';
import ThemeToggle from './ThemeToggle';
import AuthThemeToggle from '@/app/(auth)/ThemeToggle';
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

  if (!subdomain) {
    return (
      <>
        <AuthBg />
        <AuthThemeToggle />
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#161b2e] p-8 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-500/15">
              <svg className="h-6 w-6 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-gray-900 dark:text-white">Negocio no encontrado</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Esta página debe accederse mediante el enlace de lealtad del negocio.
            </p>
          </div>
        </div>
      </>
    );
  }

  if (!code) {
    let tenantName: string | undefined;
    let tenantLogoUrl: string | null = null;
    let tenantLogoPadding = 8;
    let primaryColor: string | undefined;
    try {
      const tenant      = await getTenantBySubdomainPublic(subdomain);
      tenantName        = tenant.name;
      tenantLogoUrl     = tenant.logo_url;
      tenantLogoPadding = tenant.logo_padding;
    } catch { /* Tenant not found */ }
    return <EntryScreen tenantName={tenantName} logoUrl={tenantLogoUrl} logoPadding={tenantLogoPadding} primaryColor={primaryColor} />;
  }

  let data: PortalData;
  try {
    const tenant = await getTenantBySubdomainPublic(subdomain);
    data = await getPortalData(tenant.id, code);
  } catch (err) {
    if (err instanceof TenantNotFoundError) notFound();
    if (err instanceof NotFoundError) {
      return (
        <EntryScreen
          error="Código no encontrado. Verifícalo e inténtalo de nuevo."
          primaryColor={undefined}
          tenantName={undefined}
        />
      );
    }
    throw err;
  }

  return <PortalShell data={data} code={code} tab={tab} />;
}

// ── Auth-style background (shared by entry + not-found screens) ────────

function AuthBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-gray-950">
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-indigo-300/30 dark:bg-indigo-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-violet-300/25 dark:bg-violet-500/15 blur-3xl" />
      <div className="absolute top-1/2 right-1/4 h-72 w-72 rounded-full bg-blue-200/20 dark:bg-blue-500/10 blur-3xl" />
    </div>
  );
}

// ── Entry screen ──────────────────────────────────────────────────────

function EntryScreen({
  tenantName,
  logoUrl,
  logoPadding = 8,
  primaryColor,
  error,
}: {
  tenantName?: string;
  logoUrl?: string | null;
  logoPadding?: number;
  primaryColor?: string;
  error?: string;
}) {
  return (
    <>
      <AuthBg />
      <AuthThemeToggle />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6 text-center">

          {/* Brand block: tenant logo (if set) or Fideliza logo */}
          <div className="flex flex-col items-center gap-3">
            {logoUrl ? (
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-[#161b2e] shadow-md ring-1 ring-black/5 dark:ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt={tenantName ?? 'Logo'}
                  className="h-full w-full object-contain"
                  style={{ padding: logoPadding }}
                />
              </div>
            ) : (
              <>
                <img src="/logofidelizalight.svg" alt="Fideliza" className="block dark:hidden h-16 w-auto" />
                <img src="/logofideliza.svg" alt="Fideliza" className="hidden dark:block h-16 w-auto" />
              </>
            )}
            {tenantName && (
              <p className="text-[11px] font-bold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
                {tenantName}
              </p>
            )}
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
              Tu tarjeta de fidelidad
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
              Ingresa tu código de acceso para ver tus puntos y recompensas.
            </p>
          </div>

          {/* Card */}
          <div className="rounded-2xl bg-white dark:bg-[#161b2e] px-6 py-6 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5">
            <CodeEntryForm error={error} primaryColor={primaryColor} />
          </div>

          {/* Footer */}
          <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
            <strong className="text-indigo-400 font-bold">Fideliza</strong> · sin descargas, sin contraseñas
          </p>

        </div>
      </div>
    </>
  );
}

// ── Portal shell ──────────────────────────────────────────────────────

// Fixed accent color used for all UI components — independent of tenant branding.
// Tenant primary/secondary colors are ONLY used for the gradient header.
const ACCENT = '#6366F1';

function PortalShell({ data, code, tab }: { data: PortalData; code: string; tab: Tab }) {
  const { tenant, customer, enrollments, recent_transactions, pending_vouchers } = data;
  const tabHref = (t: Tab) => `?code=${code}&tab=${t}`;

  return (
    <div className="flex min-h-screen flex-col bg-gray-100 dark:bg-[#07090f]">
      <AutoRefresh intervalMs={20_000} />

      {/* ── Gradient header ──────────────────────────────────────── */}
      <header
        className="relative px-4 pt-6 pb-5 text-white"
        style={{
          background: `linear-gradient(135deg, ${tenant.primary_color} 0%, ${tenant.secondary_color} 100%)`,
        }}
      >
        <div className="mx-auto max-w-lg flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            {/* Tenant logo (if uploaded) */}
            {tenant.logo_url && (
              <div className="shrink-0 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-full w-full object-contain"
                  style={{ padding: tenant.logo_padding }}
                />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
                {tenant.name}
              </p>
              <h1 className="mt-1 text-2xl font-bold leading-tight">{customer.name}</h1>
              <p className="mt-0.5 font-mono text-sm opacity-60">{customer.access_code}</p>
              {tenant.welcome_message && (
                <p className="mt-2 text-sm opacity-80 leading-snug">{tenant.welcome_message}</p>
              )}
            </div>
          </div>
          <div className="shrink-0 pt-1">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* ── Tab bar ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 border-b border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#0f1222] shadow-sm">
        <div className="mx-auto flex max-w-lg">
          {([
            {
              key: 'points' as Tab,
              label: 'Puntos',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              ),
            },
            {
              key: 'rewards' as Tab,
              label: 'Recompensas',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                </svg>
              ),
            },
            {
              key: 'history' as Tab,
              label: 'Historial',
              icon: (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              ),
            },
          ]).map(({ key, label, icon }) => {
            const active = tab === key;
            return (
              <Link
                key={key}
                href={tabHref(key)}
                className={`flex flex-1 flex-col items-center gap-1 py-3 text-xs font-semibold transition-colors border-b-2 ${
                  active
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {icon}
                {label}
              </Link>
            );
          })}
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
            customerId={customer.id}
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
      <p className="pb-8 text-center text-xs text-gray-400 dark:text-gray-600">
        Miembro desde {new Date(customer.member_since).toLocaleDateString('es', { year: 'numeric', month: 'long' })}
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

function RewardRow({
  reward: r,
  primaryColor,
  tenantId,
  customerId,
  enrollmentId,
}: {
  reward: PortalReward;
  primaryColor: string;
  tenantId: string;
  customerId: string;
  enrollmentId: string;
}) {
  const amountNeeded = Math.max(0, r.progress_total - r.progress_current);
  const progressPct  = r.progress_total > 0
    ? Math.min(100, (r.progress_current / r.progress_total) * 100)
    : 0;

  // ── Affordable & in stock — highlighted card + redeem button ──────────
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
                <p className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">
                  {r.progress_total.toLocaleString()} {r.progress_label}
                </p>
              </div>
              {r.description && (
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{r.description}</p>
              )}
            </div>
          </div>
          <RedeemButton
            tenantId={tenantId}
            customerId={customerId}
            rewardId={r.id}
            enrollmentId={enrollmentId}
            primaryColor={primaryColor}
            rewardName={r.name}
          />
          {r.expiry_days && (
            <p className="mt-2 text-center text-xs text-gray-400 dark:text-gray-500">El voucher vence en {r.expiry_days} días</p>
          )}
        </div>
      </div>
    );
  }

  // ── Out of stock ──────────────────────────────────────────────────────
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
            <p className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">
              {r.progress_total.toLocaleString()} {r.progress_label}
            </p>
          </div>
          {r.description && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{r.description}</p>}
          <p className="mt-1 text-xs font-medium text-red-400">Sin stock</p>
        </div>
      </div>
    );
  }

  // ── Locked — amber lock + progress bar ────────────────────────────────
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
          <p className="shrink-0 text-sm font-semibold text-gray-400 dark:text-gray-500">
            {r.progress_total.toLocaleString()} {r.progress_label}
          </p>
        </div>
        {r.description && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{r.description}</p>
        )}
        <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: primaryColor }} />
        </div>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Faltan {amountNeeded.toLocaleString()} {r.progress_label} para completar
        </p>
        {r.expiry_days && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">El voucher vence en {r.expiry_days} días</p>
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

// ── Shared sub-components ─────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
      {children}
    </h2>
  );
}

function EmptyState({
  type,
  title,
  message,
}: {
  type: 'programs' | 'rewards' | 'history';
  title: string;
  message: string;
}) {
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

// ── Enrollment card ───────────────────────────────────────────────────

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
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {programTypeLabel[e.program_type]}
          </p>
        </div>
        <ProgramBadge type={e.program_type} primaryColor={primaryColor} />
      </div>

      <div className="mt-4">
        {e.program_type === 'stamp' && (
          <StampGrid
            count={e.stamp_count}
            config={e.program_config}
            primaryColor={primaryColor}
            firstRewardName={e.rewards[0]?.name}
          />
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
        <div className="mt-4 rounded-xl p-3.5" style={{ backgroundColor: `${primaryColor}12` }}>
          <p className="text-xs font-semibold mb-2" style={{ color: primaryColor }}>
            Puedes canjear:
          </p>
          <ul className="space-y-1.5">
            {affordableRewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">{r.name}</span>
                <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
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

// ── Program badge ─────────────────────────────────────────────────────

function ProgramBadge({
  type,
  primaryColor,
}: {
  type: PortalEnrollment['program_type'];
  primaryColor: string;
}) {
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
    <div
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}
    >
      {icons[type]}
    </div>
  );
}

// ── Stamp grid ────────────────────────────────────────────────────────

function StampGrid({
  count,
  config,
  primaryColor,
  firstRewardName,
}: {
  count: number;
  config: Record<string, unknown>;
  primaryColor: string;
  firstRewardName?: string;
}) {
  const total  = typeof config.stamps_needed === 'number' ? config.stamps_needed : 10;
  const filled = Math.min(count, total);
  const remaining = total - filled;

  const StampIcon = () => (
    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.745 3.745 0 0 1 3.296-1.043A3.745 3.745 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 0 1 3.296 1.043 3.745 3.745 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
    </svg>
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: total }).map((_, i) => (
          i < filled ? (
            <div
              key={i}
              className="h-12 w-12 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: primaryColor }}
            >
              <StampIcon />
            </div>
          ) : (
            <div
              key={i}
              className="h-12 w-12 rounded-full border-2 border-dashed border-gray-200 dark:border-[#2a3147] flex items-center justify-center"
            >
              <span className="text-base font-light text-gray-300 dark:text-gray-600">+</span>
            </div>
          )
        ))}
      </div>
      <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
        {filled} / {total} sellos
        {filled < total && remaining > 0 && (
          <> · faltan{' '}
            <strong className="text-gray-900 dark:text-white">{remaining}</strong>
            {firstRewardName ? ` para ${firstRewardName.toLowerCase()}` : ' para completar'}
          </>
        )}
        {filled >= total && (
          <span className="ml-1 font-semibold text-green-600 dark:text-green-400"> · ¡Tarjeta completa! 🎉</span>
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
        <span className="text-sm text-gray-400 dark:text-gray-500">visitas en total</span>
      </div>
      {visitsNeeded && progressPct !== null && (
        <>
          <div className="mt-2.5 h-2 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, backgroundColor: primaryColor }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            {count >= visitsNeeded
              ? '¡Recompensa desbloqueada!'
              : `${visitsNeeded - count} visita${visitsNeeded - count !== 1 ? 's' : ''} más para tu recompensa`}
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
  const progress  = minRedeem ? Math.min((current / minRedeem) * 100, 100) : null;

  return (
    <div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-bold" style={{ color: primaryColor }}>
          {current.toLocaleString()}
        </span>
        <span className="text-sm text-gray-400 dark:text-gray-500">{label}</span>
      </div>

      {progress !== null && minRedeem !== null && (
        <div className="mt-2.5">
          <div className="h-2 w-full rounded-full bg-gray-100 dark:bg-[#1e2438] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
          </div>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            {current >= minRedeem
              ? '¡Tienes suficiente para canjear!'
              : `Faltan ${(minRedeem - current).toLocaleString()} ${label} para tu próxima recompensa.`}
          </p>
        </div>
      )}

      <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
        {lifetime.toLocaleString()} {label} ganados en total
      </p>
    </div>
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
  const daysLeft  = expiresAt ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000) : null;

  return (
    <div
      className="rounded-2xl border-2 p-4 shadow-sm"
      style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: primaryColor }}>
            Voucher · Listo para usar
          </p>
          <p className="mt-0.5 font-bold text-gray-900 dark:text-white">{v.reward_name}</p>
          {daysLeft !== null && (
            <p className={`mt-0.5 text-xs ${daysLeft <= 3 ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'}`}>
              {daysLeft > 0 ? `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}` : 'Vence hoy'}
            </p>
          )}
        </div>
      </div>
      <div
        className="mt-3 rounded-xl bg-white dark:bg-[#0f1222] border border-dashed px-4 py-2.5 text-center"
        style={{ borderColor: primaryColor }}
      >
        <p className="font-mono text-lg font-bold tracking-widest text-gray-900 dark:text-white">
          {v.redemption_code}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Muéstralo al personal</p>
      </div>
    </div>
  );
}

// ── Transaction row ───────────────────────────────────────────────────

const TX_LABEL: Record<string, string> = {
  earn:       'Ganado',
  stamp:      'Sello',
  redeem:     'Canjeado',
  adjustment: 'Ajustado',
  adjust:     'Ajustado',
  expire:     'Expirado',
  refund:     'Reembolsado',
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
  const isEarn  = tx.type === 'earn'  && tx.points_delta > 0;
  const isStamp = tx.type === 'stamp' && tx.points_delta > 0;
  const isPositive = tx.points_delta > 0;

  // ── Relative date ─────────────────────────────────────────────────────
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

  const typeLabel  = TX_LABEL[tx.type] ?? tx.type;
  const absVal     = Math.abs(tx.points_delta);
  const sign       = tx.points_delta > 0 ? '+' : tx.points_delta < 0 ? '-' : '';
  const unit       = isStamp ? `sello${absVal !== 1 ? 's' : ''}` : programLabel;
  const amountStr  = `${sign}${absVal.toLocaleString()} ${unit}`;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {/* ── Icon circle ─────────────────────────────────────────────── */}
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

      {/* ── Content ─────────────────────────────────────────────────── */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-800 dark:text-gray-100">
          <span className="font-semibold">{typeLabel}</span>
          {tx.note && (
            <span className="text-gray-500 dark:text-gray-400"> · {tx.note}</span>
          )}
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {tx.program_name} · {dateLabel} · {timeLabel}
        </p>
      </div>

      {/* ── Amount ──────────────────────────────────────────────────── */}
      <span
        className={`shrink-0 font-mono text-sm font-bold ${!isPositive ? 'text-gray-400 dark:text-gray-500' : isEarn ? 'text-green-600 dark:text-green-400' : ''}`}
        style={isStamp ? { color: primaryColor } : {}}
      >
        {amountStr}
      </span>
    </div>
  );
}
