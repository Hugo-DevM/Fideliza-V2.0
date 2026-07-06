/**
 * Referral registration page — /c/refer?ref=XXXX-XXXX&program=<program_id>
 *
 * When a customer shares their access code as a referral link, this page:
 *   1. Looks up the referrer by access code
 *   2. Shows a registration form for the new customer
 *   3. On submit: creates the customer, enrolls them, records the referral
 *   4. Redirects to the portal with the new customer's code
 */

import { headers } from 'next/headers';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTenantBySubdomainPublic } from '@/modules/portal';
import { TenantNotFoundError } from '@/lib/middleware/errors';
import { createServiceRoleClient } from '@/lib/supabase/server';
import AuthThemeToggle from '@/app/(auth)/ThemeToggle';
import ReferralRegisterForm from './ReferralRegisterForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ ref?: string; program?: string }>;
}

export default async function ReferralPage({ searchParams }: PageProps) {
  const headersList = await headers();
  const subdomain = headersList.get('x-tenant-subdomain');
  if (!subdomain) notFound();

  const { ref: referrerCode, program: programId } = await searchParams;
  if (!referrerCode || !programId) notFound();

  let tenantId: string;
  let tenantName: string;
  let logoUrl: string | null = null;
  let logoPadding = 8;

  try {
    const tenant = await getTenantBySubdomainPublic(subdomain);
    tenantId     = tenant.id;
    tenantName   = tenant.name;
    logoUrl      = tenant.logo_url;
    logoPadding  = tenant.logo_padding;
  } catch (err) {
    if (err instanceof TenantNotFoundError) notFound();
    throw err;
  }

  const db = createServiceRoleClient();

  // Validate referrer exists
  const { data: referrer } = await db
    .from('customers')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('access_code', referrerCode.toUpperCase().trim())
    .eq('is_active', true)
    .single() as { data: { id: string; name: string } | null };

  if (!referrer) notFound();

  // Validate program exists + referral is enabled
  const { data: program } = await db
    .from('reward_programs')
    .select('id, name, config')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .single() as { data: { id: string; name: string; config: Record<string, unknown> } | null };

  if (!program) notFound();

  const cfg = program.config ?? {};
  if (!cfg.referral_enabled) notFound();

  const referredBonus  = Number(cfg.referred_bonus ?? 50);

  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-white dark:bg-gray-950">
        <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-emerald-300/25 dark:bg-emerald-500/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-[520px] w-[520px] rounded-full bg-teal-300/20 dark:bg-teal-500/10 blur-3xl" />
      </div>
      <AuthThemeToggle />

      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">

          {/* Brand */}
          <div className="flex flex-col items-center gap-3 text-center">
            {logoUrl ? (
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-white dark:bg-[#161b2e] shadow-md ring-1 ring-black/5 dark:ring-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={tenantName} className="h-full w-full object-contain" style={{ padding: logoPadding }} />
              </div>
            ) : (
              <>
                <Image src="/logofidelizalight.svg" alt="Fideliza" width={168} height={56} className="block dark:hidden h-14 w-auto" />
                <Image src="/logofideliza.svg" alt="Fideliza" width={168} height={56} className="hidden dark:block h-14 w-auto" />
              </>
            )}
            <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
              {tenantName}
            </p>
          </div>

          {/* Invitation card */}
          <div className="rounded-2xl bg-white dark:bg-[#161b2e] px-6 py-6 shadow-xl shadow-black/10 dark:shadow-black/50 ring-1 ring-black/5 dark:ring-white/5 space-y-5">
            <div className="text-center space-y-1">
              <p className="text-2xl">🎉</p>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {referrer.name} te invitó
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Regístrate en <strong>{program.name}</strong> y gana{' '}
                <strong className="text-emerald-600 dark:text-emerald-400">{referredBonus} puntos de regalo</strong>{' '}
                desde tu primera visita.
              </p>
            </div>

            <ReferralRegisterForm
              tenantId={tenantId}
              referrerId={referrer.id}
              programId={program.id}
            />
          </div>

          <p className="text-center font-mono text-xs text-gray-400 dark:text-gray-500">
            <strong className="text-emerald-400 font-bold">Fideliza</strong> · sin descargas, sin contraseñas
          </p>
        </div>
      </div>
    </>
  );
}
