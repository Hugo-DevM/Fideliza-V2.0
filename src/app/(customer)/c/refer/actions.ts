'use server';

import { after } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { getPlanLimits, getEffectivePlan } from '@/lib/config/plans';
import { sendReferralWelcomeMessage } from '@/modules/whatsapp/whatsapp.service';

interface RegisterReferredInput {
  tenantId:      string;
  referrerId:    string;
  programId:     string;
  name:          string;
  /** E.164 (prefix + local digits). Required — it is the identity key here. */
  phone:         string;
  whatsappOptIn: boolean;
  birthMonth:    number | null;
  birthDay:      number | null;
  birthYear:     number | null;
}

type RegisterResult =
  | { accessCode: string; existing: boolean }
  | { error: string };

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export async function registerReferredCustomerAction(
  input: RegisterReferredInput,
): Promise<RegisterResult> {
  const {
    tenantId, referrerId, programId, name, phone,
    whatsappOptIn, birthMonth, birthDay, birthYear,
  } = input;
  const db = createServiceRoleClient();

  // ── Input validation ──────────────────────────────────────────────────
  const trimmedName = name.trim();
  if (trimmedName.length < 2 || trimmedName.length > 80) {
    return { error: 'Escribe tu nombre.' };
  }

  const normalizedPhone = phone.trim();
  if (!/^\+\d{7,16}$/.test(normalizedPhone)) {
    return { error: 'Escribe un número de teléfono válido.' };
  }

  // Birthday is optional, but a partial date is a mistake worth catching —
  // the birthday cron matches on month AND day, so one without the other is
  // silently useless.
  if ((birthMonth === null) !== (birthDay === null)) {
    return { error: 'Selecciona el día y el mes de tu cumpleaños.' };
  }
  if (birthMonth !== null && birthDay !== null) {
    if (birthMonth < 1 || birthMonth > 12) return { error: 'Mes inválido.' };
    if (birthDay < 1 || birthDay > DAYS_IN_MONTH[birthMonth - 1]) {
      return { error: 'Ese día no existe en el mes que elegiste.' };
    }
  }
  if (birthYear !== null) {
    const thisYear = new Date().getUTCFullYear();
    if (birthYear < thisYear - 120 || birthYear > thisYear) {
      return { error: 'Año de nacimiento inválido.' };
    }
  }

  // Referrals are a Pro feature. The per-program flag survives a downgrade, so
  // the plan is checked first. Message stays neutral — the end customer should
  // not see the business's billing status.
  const { data: tenantRow } = await db
    .from('tenants')
    .select('plan, subscription_status')
    .eq('id', tenantId)
    .single() as { data: { plan: string; subscription_status: string | null } | null };

  if (!tenantRow) return { error: 'Negocio no disponible.' };

  const planLimits = getPlanLimits(
    getEffectivePlan(tenantRow.plan, tenantRow.subscription_status)
  );
  if (!planLimits.referralProgram) {
    return { error: 'El programa de referidos no está activo.' };
  }

  // Validate the program is still active
  const { data: program } = await db
    .from('reward_programs')
    .select('config, name')
    .eq('id', programId)
    .eq('tenant_id', tenantId)
    .eq('status', 'active')
    .maybeSingle() as { data: { config: Record<string, unknown>; name: string } | null };

  if (!program) return { error: 'Programa no disponible.' };

  // Must match refer/page.tsx exactly: the switch lives in tenant_settings.
  // If these two disagree, the invitation renders and then fails on submit.
  const { data: settings } = await db
    .from('tenant_settings')
    .select('referral_enabled, referral_program_configs')
    .eq('tenant_id', tenantId)
    .maybeSingle() as {
      data: {
        referral_enabled: boolean | null;
        referral_program_configs: Record<string, { referrer_bonus: number; referred_bonus: number }> | null;
      } | null;
    };

  if (!settings?.referral_enabled) {
    return { error: 'El programa de referidos no está activo.' };
  }

  const referredBonus = Number(
    settings.referral_program_configs?.[programId]?.referred_bonus ?? 50
  );

  // ── Already a customer here? ──────────────────────────────────────────
  // Send them to the card they already have instead of minting a second one.
  //
  // Two reasons this matters. Sharing a referral link with someone who already
  // buys from you is the common case, and a duplicate would strand their
  // existing balance on an orphaned record they can no longer reach. And
  // without this check the welcome bonus is farmable: re-open the link, get
  // another 50 points, repeat.
  //
  // No new customer, no referral row, no bonus — just their existing code.
  const { data: duplicate } = await db
    .from('customers')
    .select('access_code')
    .eq('tenant_id', tenantId)
    .eq('phone', normalizedPhone)
    .maybeSingle() as { data: { access_code: string } | null };

  if (duplicate) {
    return { accessCode: duplicate.access_code, existing: true };
  }

  // Fetch referrer name for the WhatsApp message
  const { data: referrer } = await db
    .from('customers')
    .select('name')
    .eq('id', referrerId)
    .eq('tenant_id', tenantId)
    .single() as { data: { name: string } | null };

  // Fetch tenant name
  const { data: tenant } = await db
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single() as { data: { name: string } | null };

  const businessName = tenant?.name ?? '';

  // Generate access code: 5 uppercase alphanumeric chars + hyphen + 5 more
  function generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 10; i++) {
      if (i === 5) code += '-';
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  // Ensure unique code
  let accessCode = generateCode();
  for (let attempts = 0; attempts < 5; attempts++) {
    const { data: existing } = await db
      .from('customers')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('access_code', accessCode)
      .maybeSingle();
    if (!existing) break;
    accessCode = generateCode();
  }

  // Create the referred customer.
  // whatsapp_opt_in is the customer's explicit choice, not inferred from having
  // typed a phone number — consent has to be given, not assumed.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newCustomer, error: createErr } = await (db.from('customers') as any)
    .insert({
      tenant_id:            tenantId,
      name:                 trimmedName,
      phone:                normalizedPhone,
      access_code:          accessCode,
      whatsapp_opt_in:      whatsappOptIn,
      whatsapp_opted_in_at: whatsappOptIn ? new Date().toISOString() : null,
      birth_month:          birthMonth,
      birth_day:            birthDay,
      birth_year:           birthYear,
      is_active:            true,
    })
    .select('id, access_code')
    .single() as { data: { id: string; access_code: string } | null; error: unknown };

  if (createErr || !newCustomer) {
    return { error: 'No se pudo crear el cliente. Intenta de nuevo.' };
  }

  // Record the referral (pending — the REFERRER is paid on the referred's first earn).
  //
  // program_id is set here on purpose: it marks that the welcome bonus below was
  // already credited, so the first-earn hook in transaction.service.ts does not
  // credit it a second time. The dashboard signup path leaves it null because it
  // pays nothing up front. Do not change one side without the other.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (db as any).from('referrals').insert({
    tenant_id:   tenantId,
    referrer_id: referrerId,
    referred_id: newCustomer.id,
    program_id:  programId,
    status:      'pending',
  });

  // Credit referred bonus directly (no earn needed to get the welcome gift)
  if (referredBonus > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).rpc('rpc_earn_points', {
      p_tenant_id:    tenantId,
      p_customer_id:  newCustomer.id,
      p_program_id:   programId,
      p_points_delta: referredBonus,
      p_note:         `Bono referido por ${referrer?.name ?? 'un amigo'}`,
    });
  }

  // WhatsApp notification — deferred with `after()` so the response can return
  // immediately without the serverless container freezing before it is enqueued.
  // Only when the customer actually opted in.
  if (whatsappOptIn) {
    after(async () => {
      await sendReferralWelcomeMessage(
        newCustomer.id,
        tenantId,
        trimmedName,
        businessName,
        normalizedPhone,
        referredBonus,
        referrer?.name ?? 'un amigo',
      );
    });
  }

  return { accessCode: newCustomer.access_code, existing: false };
}
