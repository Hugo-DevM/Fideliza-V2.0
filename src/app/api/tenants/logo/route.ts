import { NextResponse } from 'next/server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';
import { updateTenant } from '@/modules/tenants/tenant.repository';
import { enforcePortalBranding } from '@/lib/middleware/plan-limits';
import { ForbiddenError } from '@/lib/middleware/errors';

const BUCKET         = 'logos';
const MAX_BYTES      = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES  = ['image/jpeg', 'image/png', 'image/webp'] as const;
const EXT_MAP: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

async function getAuthenticatedTenantId(): Promise<string | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return (user.user_metadata?.tenant_id as string | undefined) ?? null;
}

// ── POST /api/tenants/logo — upload a new logo ─────────────────────────────

export async function POST(request: Request) {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  try {
    await enforcePortalBranding(tenantId);
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }

  const formData = await request.formData();
  const file = formData.get('logo') as File | null;

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No se recibió ningún archivo.' }, { status: 400 });
  }

  if (!(ALLOWED_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json(
      { error: 'Formato no válido. Usa JPG, PNG o WebP.' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'El archivo supera el límite de 2 MB.' },
      { status: 400 }
    );
  }

  const ext    = EXT_MAP[file.type];
  const path   = `${tenantId}/logo.${ext}`;
  const buffer = await file.arrayBuffer();
  const admin  = createServiceRoleClient();

  // Remove any existing logo with a different extension first
  const otherExts = Object.values(EXT_MAP).filter((e) => e !== ext);
  await admin.storage.from(BUCKET).remove(otherExts.map((e) => `${tenantId}/logo.${e}`));

  // Upload (upsert so re-uploading same extension works)
  const { error: uploadError } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Cache-bust by appending a timestamp to the public URL
  const { data: { publicUrl } } = admin.storage.from(BUCKET).getPublicUrl(path);
  const urlWithBust = `${publicUrl}?t=${Date.now()}`;

  await updateTenant(tenantId, { logo_url: urlWithBust });

  return NextResponse.json({ url: urlWithBust });
}

// ── DELETE /api/tenants/logo — remove logo ─────────────────────────────────

export async function DELETE() {
  const tenantId = await getAuthenticatedTenantId();
  if (!tenantId) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const admin = createServiceRoleClient();
  const paths = Object.values(EXT_MAP).map((ext) => `${tenantId}/logo.${ext}`);
  await admin.storage.from(BUCKET).remove(paths);

  await updateTenant(tenantId, { logo_url: null });

  return NextResponse.json({ success: true });
}
