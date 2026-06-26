/**
 * POST /api/admin/whatsapp-test
 *
 * Test endpoint — inserts one queue row per template for each phone number
 * provided, bypassing quality gates and frequency caps.
 *
 * Protected by CRON_SECRET (same header as cron routes).
 * NEVER expose this route without auth — it fires real WhatsApp messages.
 *
 * Body:
 *   {
 *     tenant_id: string,       // UUID of the tenant to test against
 *     phones:    string[],     // E.164 phone numbers (must exist as customers)
 *     templates?: string[],    // optional subset of template names to test
 *   }
 *
 * Usage (curl):
 *   curl -X POST https://your-app.vercel.app/api/admin/whatsapp-test \
 *     -H "Authorization: Bearer $CRON_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tenant_id":"<uuid>","phones":["+521234567890"]}'
 */

import { NextResponse }            from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// ── Template definitions ──────────────────────────────────────────────────────
// Each entry maps a template name to:
//   category  — 'utility' | 'marketing'
//   priority  — lower = higher priority
//   params()  — function that receives context and returns the params record

interface TemplateCtx {
  customerName: string;
  businessName: string;
  unitLabel:    string;
}

interface TemplateDef {
  category: 'utility' | 'marketing';
  priority: number;
  params:   (ctx: TemplateCtx) => Record<string, string>;
}

const TEMPLATES: Record<string, TemplateDef> = {
  fideliza_welcome_v2: {
    category: 'utility',
    priority: 1,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': businessName,
      '3': unitLabel,
    }),
  },
  fideliza_voucher_expiry_v2: {
    category: 'utility',
    priority: 4,
    params: ({ customerName, businessName }) => ({
      '1': customerName,
      '2': 'Café gratis',
      '3': businessName,
      '4': '3',
    }),
  },
  fideliza_balance_reminder_v2: {
    category: 'utility',
    priority: 4,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': '75',
      '3': businessName,
      '4': '25',
      '5': 'Descuento 20%',
      '6': unitLabel,
    }),
  },
  fideliza_reactivation_v2: {
    category: 'marketing',
    priority: 5,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': businessName,
      '3': '50',
      '4': unitLabel,
    }),
  },
  fideliza_streak_at_risk_v2: {
    category: 'marketing',
    priority: 5,
    params: ({ customerName, businessName }) => ({
      '1': customerName,
      '2': '4',
      '3': businessName,
    }),
  },
  fideliza_promotion_v2: {
    category: 'marketing',
    priority: 5,
    params: ({ customerName, businessName }) => ({
      '1': customerName,
      '2': businessName,
    }),
  },
  fideliza_birthday_v2: {
    category: 'marketing',
    priority: 2,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': businessName,
      '3': '100',
      '4': unitLabel,
    }),
  },
  fideliza_milestone_80_v2: {
    category: 'utility',
    priority: 3,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': businessName,
      '3': '20',
      '4': 'Postre gratis',
      '5': unitLabel,
    }),
  },
  fideliza_tier_upgrade_v2: {
    category: 'utility',
    priority: 2,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': businessName,
      '3': 'Silver',
      '4': '1.5',
      '5': unitLabel,
    }),
  },
  fideliza_surprise_v2: {
    category: 'marketing',
    priority: 3,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': businessName,
      '3': '2',
      '4': unitLabel,
    }),
  },
  fideliza_referral_earned_v2: {
    category: 'utility',
    priority: 2,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,       // referrer name
      '2': 'María López',      // referred name
      '3': '200',
      '4': businessName,
      '5': unitLabel,
    }),
  },
  fideliza_referral_welcome_v2: {
    category: 'utility',
    priority: 2,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,       // referred name
      '2': businessName,
      '3': '150',
      '4': 'Carlos Pérez',     // referrer name
      '5': unitLabel,
    }),
  },
  fideliza_challenge_completed_v2: {
    category: 'utility',
    priority: 2,
    params: ({ customerName, businessName, unitLabel }) => ({
      '1': customerName,
      '2': 'Visita 5 veces en un mes',
      '3': '300',
      '4': businessName,
      '5': unitLabel,
    }),
  },
};

const ALL_TEMPLATE_NAMES = Object.keys(TEMPLATES);

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  // Auth
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { tenant_id?: string; phones?: string[]; templates?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { tenant_id, phones, templates } = body;
  if (!tenant_id || !phones?.length) {
    return NextResponse.json(
      { error: 'tenant_id and phones[] are required' },
      { status: 400 },
    );
  }

  const templateNames = templates?.length
    ? templates.filter((t) => ALL_TEMPLATE_NAMES.includes(t))
    : ALL_TEMPLATE_NAMES;

  if (!templateNames.length) {
    return NextResponse.json({ error: 'No valid templates specified' }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any;

  // Fetch tenant context
  const { data: tenant } = await db
    .from('tenants')
    .select('id, name, whatsapp_from')
    .eq('id', tenant_id)
    .single();

  if (!tenant) {
    return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
  }

  const { data: tenantSettings } = await db
    .from('tenant_settings')
    .select('program_label')
    .eq('tenant_id', tenant_id)
    .single();

  const businessName = tenant.name ?? 'Tu negocio';
  const unitLabel    = tenantSettings?.program_label ?? 'Puntos';
  const fromNumber   = tenant.whatsapp_from ?? null;

  // Look up customers by phone number
  const normalizedPhones = phones.map((p) =>
    p.startsWith('+') ? p : `+${p}`,
  );

  const { data: customers } = await db
    .from('customers')
    .select('id, name, phone')
    .eq('tenant_id', tenant_id)
    .in('phone', normalizedPhones);

  if (!customers?.length) {
    return NextResponse.json(
      {
        error: 'No customers found for the provided phones in this tenant',
        searched: normalizedPhones,
      },
      { status: 404 },
    );
  }

  // Build queue rows
  const rows: Record<string, unknown>[] = [];

  for (const customer of customers) {
    const ctx: TemplateCtx = {
      customerName: customer.name ?? 'Cliente',
      businessName,
      unitLabel,
    };

    for (const templateName of templateNames) {
      const def = TEMPLATES[templateName];
      rows.push({
        tenant_id:         tenant_id,
        customer_id:       customer.id,
        phone_number:      customer.phone,
        from_number:       fromNumber,
        template_name:     templateName,
        template_category: def.category,
        template_params:   def.params(ctx),
        priority:          def.priority,
        scheduled_at:      new Date().toISOString(),
        status:            'pending',
      });
    }
  }

  const { error: insertError } = await db
    .from('whatsapp_message_queue')
    .insert(rows);

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to insert messages', detail: String(insertError) },
      { status: 500 },
    );
  }

  // Summary grouped by customer
  const summary = customers.map((c: { id: string; name: string; phone: string }) => ({
    phone:     c.phone,
    name:      c.name,
    templates: templateNames.length,
  }));

  return NextResponse.json({
    queued:    rows.length,
    customers: summary,
    templates: templateNames,
    note:      'Messages queued. Trigger /api/cron/whatsapp-send to dispatch immediately.',
  });
}
