/**
 * POST /api/auth/reset-password
 *
 * Completes the custom password reset flow:
 *   1. Validates the token format
 *   2. Looks up the token in password_reset_tokens
 *   3. Verifies: exists, not expired, not used
 *   4. Validates password strength server-side
 *   5. Updates the password via Supabase Admin API
 *   6. Marks the token as used (single-use guarantee)
 *
 * Security:
 *   - Token is invalidated immediately on first successful use
 *   - Expired tokens are rejected with a clear message
 *   - Rate limited: 10 requests / 15 min per IP (tokens have 256-bit entropy
 *     so brute force is computationally infeasible, but we still limit anyway)
 *   - Password requirements enforced server-side (min 8 chars, uppercase,
 *     lowercase, number or symbol) — mirrors the client-side checklist
 */

import { NextResponse }            from 'next/server';
import { z }                       from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { withPublicContext }        from '@/lib/middleware/api-context';
import { getClientIp }             from '@/lib/middleware/api-context';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/middleware/rate-limit';
import { parseBody }               from '@/lib/validation';
import type { ApiResponse }        from '@/lib/types';

// Server-side password rules — mirrors Supabase's password policy exactly
const PASSWORD_RE = {
  upper:  /[A-ZÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝ]/,
  lower:  /[a-zàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/,
  digit:  /[0-9]/,
  symbol: /[^a-zA-Z0-9]/,  // any character that is not a letter or digit
};

const ResetSchema = z.object({
  token:    z.string().length(64).regex(/^[0-9a-f]+$/),
  password: z.string().min(8).max(72),
});

function validatePassword(password: string): string | null {
  if (password.length < 8)                 return 'La contraseña debe tener al menos 8 caracteres.';
  if (!PASSWORD_RE.upper.test(password))   return 'La contraseña debe incluir al menos una letra mayúscula.';
  if (!PASSWORD_RE.lower.test(password))   return 'La contraseña debe incluir al menos una letra minúscula.';
  if (!PASSWORD_RE.digit.test(password))   return 'La contraseña debe incluir al menos un número (0-9).';
  if (!PASSWORD_RE.symbol.test(password))  return 'La contraseña debe incluir al menos un símbolo (!@#$%...).';
  return null;
}

export const POST = withPublicContext<{ message: string }>(
  async (request) => {
    const ip = getClientIp(request);

    // Rate limit: 10 requests per 15 min per IP
    const rl = await checkRateLimit(`pw-reset-confirm:${ip}`, 10, 15 * 60 * 1000);
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    // Parse & validate body
    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = ResetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Token o contraseña inválidos.' },
        { status: 422 }
      );
    }

    const { token, password } = parsed.data;

    // Server-side password validation
    const pwError = validatePassword(password);
    if (pwError) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: pwError },
        { status: 422 }
      );
    }

    const db = createServiceRoleClient();

    // Look up token
    const { data: tokenRow, error: fetchError } = await (db as any)
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used')
      .eq('token', token)
      .single();

    if (fetchError || !tokenRow) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'El enlace de recuperación es inválido o ya fue usado.' },
        { status: 400 }
      );
    }

    // Check used
    if (tokenRow.used) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Este enlace ya fue utilizado. Solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // Check expiry
    if (new Date(tokenRow.expires_at) < new Date()) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'El enlace expiró. Solicita uno nuevo desde la página de recuperación.' },
        { status: 400 }
      );
    }

    // Update password via Admin API
    const { error: updateError } = await db.auth.admin.updateUserById(
      tokenRow.user_id,
      { password }
    );

    if (updateError) {
      console.error('[password-reset] updateUserById failed:', JSON.stringify(updateError));

      const msg = updateError.message?.toLowerCase() ?? '';
      let userFacingError = 'No se pudo actualizar la contraseña. Intenta de nuevo.';

      if (msg.includes('same password') || msg.includes('different from'))
        userFacingError = 'La nueva contraseña no puede ser igual a la anterior.';
      else if (msg.includes('too weak') || msg.includes('pwned') || msg.includes('breach'))
        userFacingError = 'Esta contraseña es demasiado común o fue filtrada. Elige una diferente.';
      else if (msg.includes('at least'))
        userFacingError = 'La contraseña no cumple los requisitos mínimos de Supabase.';
      else if (msg.includes('not found'))
        userFacingError = 'No se encontró la cuenta asociada. Contacta soporte.';

      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: userFacingError },
        { status: 500 }
      );
    }

    // Invalidate token immediately (single-use)
    await (db as any)
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', tokenRow.id);

    console.info('[password-reset] Password updated for user:', tokenRow.user_id);

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: { message: 'Contraseña actualizada correctamente. Ya puedes iniciar sesión.' }, error: null },
      { status: 200 }
    );
  }
);
