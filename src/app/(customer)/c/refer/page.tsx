/**
 * Referral registration page — /c/refer?ref=XXXXXX&program=<program_id>
 *
 * `ref` is the referrer's 6-char referral_code (never their access_code).
 *
 * When a customer shares their referral link, this page:
 *   1. Looks up the referrer by referral code
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
import { logger } from '@/lib/utils/logger';
import { formatUnitAmount } from '@/lib/utils/program-units';
import ReferralRegisterForm from './ReferralRegisterForm';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ ref?: string; program?: string }>;
}

/**
 * Every rejection on this page renders the same 404, which made a broken
 * referral link impossible to diagnose from the outside — seven different
 * causes, one identical dead end. Log the reason before bailing so the cause is
 * visible in the server logs.
 */
function rejectWith(reason: string, ctx: Record<string, unknown> = {}): never {
  logger.warn('[refer] link rejected', { reason, ...ctx });
  notFound();
}

export default async function ReferralPage({ searchParams }: PageProps) {
  const headersList = await headers();
  const subdomain = headersList.get('x-tenant-subdomain');
  if (!subdomain) rejectWith('no_subdomain');

  const { ref: referrerCode, program: programId } = await searchParams;
  if (!referrerCode || !programId) {
    rejectWith('missing_params', { subdomain, hasRef: Boolean(referrerCode), hasProgram: Boolean(programId) });
  }

  let tenant: Awaited<ReturnType<typeof getTenantBySubdomainPublic>>;

  try {
    tenant = await getTenantBySubdomainPublic(subdomain);
  } catch (err) {
    if (err instanceof TenantNotFoundError) rejectWith('tenant_not_found', { subdomain });
    throw err;
  }

  // Referrals are a Pro feature. The tenant_settings flag survives a downgrade,
  // so the plan is checked first — otherwise an already-shared link would keep
  // registering referrals after the tenant drops to Starter/Free.
  if (!tenant.referralProgram) rejectWith('plan_lacks_referrals', { subdomain });

  const tenantId    = tenant.id;
  const tenantName  = tenant.name;
  const logoUrl     = tenant.logo_url;
  const logoPadding = tenant.logo_padding;

  const db = createServiceRoleClient();

  // Validate referrer exists.
  //
  // Looked up by referral_code (6 chars), NOT access_code: the portal builds
  // this link from referral_code, and access_code is the customer's credential
  // — putting it in a link they broadcast would let anyone open their card.
  const { data: referrer } = await db
    .from('customers')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .eq('referral_code', referrerCode.toUpperCase().trim())
    .eq('is_active', true)
    .maybeSingle() as { data: { id: string; name: string } | null };

  if (!referrer) rejectWith('referrer_not_found', { subdomain, referrerCode });

  // Validate program exists and is active
  const { data: program } = await db
    .from('reward_programs')
    .select('id, name, type')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle() as { data: { id: string; name: string; type: string } | null };

  if (!program) rejectWith('program_not_found_or_inactive', { subdomain, programId });

  // The enable switch and the bonus amounts both live in tenant_settings —
  // the same place /dashboard/referidos writes, the portal reads to decide
  // whether to show the share button, and transaction.service.ts reads to pay
  // the referrer. One source of truth for all three.
  //
  // This used to read reward_programs.config.referral_enabled, which no live UI
  // ever wrote (its editor was dropped from the program screen but the check
  // stayed), so every referral link 404'd for every tenant.
  const { data: settings } = await db
    .from('tenant_settings')
    .select('referral_enabled, referral_program_configs, phone_prefix')
    .eq('tenant_id', tenantId)
    .maybeSingle() as {
      data: {
        referral_enabled: boolean | null;
        referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }> | null;
        phone_prefix: string | null;
      } | null;
    };

  if (!settings?.referral_enabled) {
    rejectWith('referrals_disabled_in_settings', { subdomain, programId });
  }

  const referredBonus = Number(
    settings.referral_program_configs?.[program.id]?.referred_bonus ?? 50
  );

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
                <strong className="text-emerald-600 dark:text-emerald-400">
                  {formatUnitAmount(program.type, referredBonus)} de regalo
                </strong>{' '}
                desde tu primera visita.
              </p>
            </div>

            <ReferralRegisterForm
              tenantId={tenantId}
              referrerId={referrer.id}
              programId={program.id}
              phonePrefix={settings.phone_prefix}
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
