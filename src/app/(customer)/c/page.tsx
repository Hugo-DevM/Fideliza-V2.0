/**
 * Customer portal page — /c?code=XXXX-XXXX&tab=points|rewards|history
 *
 * Server component. No authentication — the access code IS the credential.
 * Tenant is resolved from x-tenant-subdomain (injected by middleware).
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import CodeEntryForm from './CodeEntryForm';
import AutoRefresh from './AutoRefresh';
import ThemeToggle from './ThemeToggle';
import AuthThemeToggle from '@/app/(auth)/ThemeToggle';
import PortalTabsClient from './PortalTabsClient';
import { getPortalData, getTenantBySubdomainPublic } from '@/modules/portal';
import { NotFoundError, TenantNotFoundError } from '@/lib/middleware/errors';
import type { PortalData } from '@/modules/portal';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ code?: string; tab?: string }>;
}

type Tab = 'points' | 'rewards' | 'history' | 'ranking';

// ── Page ──────────────────────────────────────────────────────────────

export default async function CustomerPortalPage({ searchParams }: PageProps) {
  const headersList = await headers();
  const subdomain = headersList.get('x-tenant-subdomain');

  const { code: rawCode, tab: rawTab } = await searchParams;
  const code = rawCode?.toUpperCase().trim();
  const tab: Tab = (['rewards', 'history', 'ranking'] as string[]).includes(rawTab ?? '')
    ? (rawTab as Tab)
    : 'points';

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

function PortalShell({ data, code, tab }: { data: PortalData; code: string; tab: Tab }) {
  const { tenant, customer } = data;

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
        <div className="mx-auto max-w-lg relative">
          <div className="absolute right-0 top-0">
            <ThemeToggle />
          </div>
          <div className="flex flex-col items-center text-center">
            {tenant.logo_url && (
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-white/40 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="h-full w-full object-contain"
                  style={{ padding: tenant.logo_padding }}
                />
              </div>
            )}
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">{tenant.name}</p>
            <h1 className="mt-1 text-2xl font-bold leading-tight">{customer.name}</h1>
            <p className="mt-0.5 font-mono text-sm opacity-60">{customer.access_code}</p>
            {tenant.welcome_message && (
              <p className="mt-2 text-sm opacity-80 leading-snug max-w-xs">{tenant.welcome_message}</p>
            )}
          </div>
        </div>
      </header>

      {/* Tab bar + content — client component for instant switching */}
      <PortalTabsClient data={data} code={code} initialTab={tab} />
    </div>
  );
}
