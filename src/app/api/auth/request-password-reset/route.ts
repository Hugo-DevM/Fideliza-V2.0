/**
 * POST /api/auth/request-password-reset
 *
 * Initiates a custom password reset flow:
 *   1. Validates the email format
 *   2. Looks up the auth user by email (admin API)
 *   3. Generates a cryptographically secure token
 *   4. Persists the token to password_reset_tokens with a 15-min expiry
 *   5. Sends a reset link via Resend
 *
 * Security:
 *   - Always returns 200 regardless of whether the email is registered
 *     (prevents user enumeration attacks)
 *   - Rate limited: 5 requests / hour per IP
 *   - Tokens are 32 random bytes → 256-bit entropy
 *   - Previous unused tokens for the same user are NOT invalidated automatically;
 *     they expire naturally. The last-issued token wins.
 */

import { NextResponse }            from 'next/server';
import { z }                       from 'zod';
import { randomBytes }             from 'crypto';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail }  from '@/lib/email/resend';
import { withPublicContext }        from '@/lib/middleware/api-context';
import { getClientIp }             from '@/lib/middleware/api-context';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/middleware/rate-limit';
import { parseBody }               from '@/lib/validation';
import type { ApiResponse }        from '@/lib/types';

const TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

const RequestSchema = z.object({
  email: z.string().email().toLowerCase().trim().max(320),
});

// ─── Admin helper: find auth user by email ────────────────────────────────────
async function findAuthUserByEmail(email: string): Promise<{ id: string; email: string } | null> {
  const supabaseUrl      = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey   = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  const res = await fetch(
    `${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}&page=1&per_page=1`,
    {
      headers: {
        apikey:        serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    }
  );

  if (!res.ok) return null;

  const body = (await res.json()) as { users?: Array<{ id: string; email: string }> };
  return body.users?.find((u) => u.email?.toLowerCase() === email) ?? null;
}

// ─── Route handler ─────────────────────────────────────────────────────────────
export const POST = withPublicContext<{ message: string }>(
  async (request) => {
    const ip = getClientIp(request);

    // Rate limit: 5 requests per hour per IP
    const rl = await checkRateLimit(`pw-reset-request:${ip}`, 5, 60 * 60 * 1000);
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    // Parse & validate body
    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Correo electrónico inválido.' },
        { status: 422 }
      );
    }

    const { email } = parsed.data;

    // Look up auth user — but always return the same response either way
    const user = await findAuthUserByEmail(email);

    if (user) {
      try {
        const db    = createServiceRoleClient();
        const token = randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + TOKEN_TTL_MS).toISOString();

        // Persist token
        const { error: insertError } = await db
          .from('password_reset_tokens')
          .insert({ user_id: user.id, token, expires_at: expiresAt });

        if (insertError) {
          console.error('[password-reset] Token insert failed:', insertError.message);
        } else {
          // Send email (fire-and-forget errors to avoid leaking state)
          await sendPasswordResetEmail(email, token);
          console.info('[password-reset] Reset email sent to:', email);
        }
      } catch (err) {
        // Log but do not surface — caller always gets the same response
        console.error('[password-reset] Unexpected error:', err);
      }
    }

    // Always return 200 — never reveal whether the email exists
    return NextResponse.json<ApiResponse<{ message: string }>>(
      {
        data: { message: 'Si ese correo está registrado, recibirás un enlace de recuperación en breve.' },
        error: null,
      },
      { status: 200 }
    );
  }
);
