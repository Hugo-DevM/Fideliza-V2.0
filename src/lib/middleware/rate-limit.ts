/**
 * Rate limiter — dual-mode implementation.
 *
 * - Development / single-instance:  in-memory fixed window (Map)
 * - Production / serverless:        Upstash Redis fixed window
 *
 * Switch: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
 * When those env vars are absent the in-memory store is used automatically.
 *
 * Call sites are identical in both modes — all limiter functions are async.
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;   // Unix ms timestamp when the window resets
  limit: number;
}

// ── In-memory store (dev / single-instance) ───────────────────────────────

interface MemWindow {
  count: number;
  resetAt: number;
}

const memStore = new Map<string, MemWindow>();

// Prevent unbounded memory growth on long-running processes.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, w] of memStore.entries()) {
      if (now > w.resetAt) memStore.delete(key);
    }
  }, CLEANUP_INTERVAL_MS).unref?.();
}

function checkMemory(key: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = memStore.get(key);

  if (!existing || now > existing.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs, limit: max };
  }

  if (existing.count >= max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt, limit: max };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: max - existing.count,
    resetAt: existing.resetAt,
    limit: max,
  };
}

// ── Upstash Redis store (production / serverless) ────────────────────────

const USE_REDIS = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Lazily initialized per (max, windowMs) pair so each limiter config
// gets its own Ratelimit instance without re-creating it on every request.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let redisLimiters: Map<string, any> | null = null;

function msToUpstashDuration(ms: number): string {
  if (ms % 86_400_000 === 0) return `${ms / 86_400_000} d`;
  if (ms % 3_600_000  === 0) return `${ms / 3_600_000} h`;
  if (ms % 60_000     === 0) return `${ms / 60_000} m`;
  if (ms % 1_000      === 0) return `${ms / 1_000} s`;
  return `${ms} ms`;
}

async function checkRedis(key: string, max: number, windowMs: number): Promise<RateLimitResult> {
  const { Ratelimit } = await import('@upstash/ratelimit');
  const { Redis }     = await import('@upstash/redis');

  if (!redisLimiters) redisLimiters = new Map();

  const limiterKey = `${max}:${windowMs}`;
  if (!redisLimiters.has(limiterKey)) {
    const redis = new Redis({
      url:   process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    redisLimiters.set(
      limiterKey,
      new Ratelimit({
        redis,
        limiter:   Ratelimit.fixedWindow(max, msToUpstashDuration(windowMs) as Parameters<typeof Ratelimit.fixedWindow>[1]),
        analytics: false,
      })
    );
  }

  const result = await redisLimiters.get(limiterKey)!.limit(key);

  return {
    allowed:   result.success,
    remaining: result.remaining,
    resetAt:   result.reset,   // Upstash returns Unix ms timestamp
    limit:     result.limit,
  };
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Core rate limit check. Returns result — caller decides what to do.
 *
 * Uses Redis when UPSTASH_REDIS_REST_URL/TOKEN are set; in-memory otherwise.
 *
 * @param key       Unique key for this limit (e.g. `tenant:${id}:transactions`)
 * @param max       Maximum requests allowed per window
 * @param windowMs  Window duration in milliseconds
 */
export async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (USE_REDIS) return checkRedis(key, max, windowMs);
  return checkMemory(key, max, windowMs);
}

/**
 * Pre-configured limiters for common scenarios.
 * All return Promise<RateLimitResult>.
 *
 * Tune these values based on observed traffic patterns.
 */
export const rateLimiters = {
  /** Public read endpoints — relatively generous */
  publicRead:           (key: string) => checkRateLimit(key, 120, 60_000),

  /** Mutation endpoints on authenticated tenants */
  tenantMutation:       (key: string) => checkRateLimit(key, 60, 60_000),

  /** Transaction creation — tighter limit, high business impact */
  transaction:          (key: string) => checkRateLimit(key, 30, 60_000),

  /** Tenant onboarding (POST /tenants) — very tight */
  onboarding:           (key: string) => checkRateLimit(key, 5, 60_000),

  /** Customer access code lookup — prevent brute force */
  accessCodeLookup:     (key: string) => checkRateLimit(key, 20, 60_000),

  /** Password reset request — prevent email flooding */
  passwordResetRequest: (key: string) => checkRateLimit(key, 5, 60 * 60_000),

  /** Password reset confirm — secondary brute-force guard */
  passwordResetConfirm: (key: string) => checkRateLimit(key, 10, 15 * 60_000),
};

/**
 * Adds standard rate limit headers to a response.
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit',     String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset',     String(Math.ceil(result.resetAt / 1000)));
  return response;
}

/**
 * Returns a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitExceededResponse(result: RateLimitResult): NextResponse<ApiResponse<null>> {
  const retryAfterSec = Math.ceil((result.resetAt - Date.now()) / 1000);

  const response = NextResponse.json<ApiResponse<null>>(
    { data: null, error: 'Too many requests. Please slow down.' },
    { status: 429 }
  );

  response.headers.set('Retry-After',           String(retryAfterSec));
  response.headers.set('X-RateLimit-Limit',     String(result.limit));
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set('X-RateLimit-Reset',     String(Math.ceil(result.resetAt / 1000)));

  return response;
}
