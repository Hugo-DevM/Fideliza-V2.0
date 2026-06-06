import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { updateTenantSettings } from '@/modules/tenants/tenant.repository';

const VALID_PADDING = [0, 8, 16] as const;

async function getAuthenticatedTenantId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return (user.user_metadata?.tenant_id as string | undefined) ?? null;
}

// ── PATCH /api/tenants/logo/padding ───────────────────────────────────────────

export async function PATCH(request: Request) {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const formData = await request.formData();
  const raw = formData.get('logo_padding');
  const value = raw !== null ? Number(raw) : NaN;

  if (!Number.isFinite(value) || !(VALID_PADDING as readonly number[]).includes(value)) {
    return NextResponse.json(
      { error: 'Valor de margen no válido. Use 0, 8 o 16.' },
      { status: 400 }
    );
  }

  await updateTenantSettings(tenantId, { logo_padding: value });

  return NextResponse.json({ logo_padding: value });
}
