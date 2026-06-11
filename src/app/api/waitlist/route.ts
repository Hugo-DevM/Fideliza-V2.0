/**
 * POST /api/waitlist
 * Captures early-access signups from the landing page.
 *
 * - Rate limited per IP (10/hour) to prevent spam
 * - Email is deduplicated at the DB level (UNIQUE constraint)
 * - IP is SHA-256 hashed before storage (GDPR consideration)
 * - No auth required
 */

import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { withPublicContext } from '@/lib/middleware/api-context';
import { checkRateLimit, rateLimitExceededResponse } from '@/lib/middleware/rate-limit';
import { getClientIp } from '@/lib/middleware/api-context';
import { parseBody } from '@/lib/validation';
import type { ApiResponse } from '@/lib/types';

const WaitlistSchema = z.object({
  email: z
    .string()
    .email()
    .toLowerCase()
    .trim()
    .max(320),
  phone: z
    .string()
    .trim()
    .min(7)
    .max(20)
    .regex(/^\+?[\d\s\-().]+$/),
  name: z
    .string()
    .trim()
    .max(60)
    .regex(/^[a-zA-ZÀ-ÖØ-öø-ÿÑñ\s]*$/)
    .optional(),
  business_name: z
    .string()
    .trim()
    .max(100)
    .optional(),
  source: z
    .string()
    .max(50)
    .optional()
    .default('landing'),
});

async function hashIp(ip: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ip + (process.env.IP_HASH_SALT ?? 'fideliza-salt'));
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 16);
}

export const POST = withPublicContext<{ message: string }>(
  async (request) => {
    const ip = getClientIp(request);

    // Tight rate limit for this endpoint — 10 per hour per IP
    const rl = await checkRateLimit(`waitlist:${ip}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) return rateLimitExceededResponse(rl);

    const { body, error: bodyError } = await parseBody(request);
    if (bodyError) return bodyError;

    const parsed = WaitlistSchema.safeParse(body);
    if (!parsed.success) {
      const message = parsed.error.issues
        .map((i: { path: PropertyKey[]; message: string }) =>
          `${i.path.length ? i.path.join('.') + ': ' : ''}${i.message}`
        )
        .join('; ');
      return NextResponse.json<ApiResponse<null>>({ data: null, error: message }, { status: 422 });
    }

    const db = createServiceRoleClient();
    const hashedIp = await hashIp(ip);

    const { error } = await db.from('waitlist').insert({
      email:         parsed.data.email,
      phone:         parsed.data.phone,
      name:          parsed.data.name ?? null,
      business_name: parsed.data.business_name ?? null,
      source:        parsed.data.source,
      ip:            hashedIp,
    });

    if (error) {
      // Unique constraint violation — already signed up
      if (error.code === '23505') {
        return NextResponse.json<ApiResponse<{ message: string }>>(
          { data: { message: '¡Ya estás en la lista! Pronto estaremos en contacto.' }, error: null },
          { status: 200 }
        );
      }
      throw new Error(`Waitlist insert failed: ${error.message}`);
    }

    return NextResponse.json<ApiResponse<{ message: string }>>(
      { data: { message: '¡Estás en la lista! Te notificaremos cuando Fideliza+ lance.' }, error: null },
      { status: 201 }
    );
  }
);
