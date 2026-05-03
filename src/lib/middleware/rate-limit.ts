/**
 * In-memory rate limiter.
 *
 * Architecture notes:
 * - Uses a sliding window counter approach
 * - Store is a plain Map — works in a single-instance Node.js process
 * - For multi-instance / serverless: swap the store implementation for Redis
 *   without changing any call sites (the RateLimiter interface is stable)
 * - Stale entries are cleaned up lazily on read; a periodic cleanup
 *   prevents unbounded memory growth in long-running servers
 *
 * Rate limit keys are composed at the call site (e.g. tenantId + endpoint)
 * so limits can be applied at different granularities.
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Periodic cleanup — prevents unbounded growth on long-running instances.
// Runs every 5 minutes.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, window] of store.entries()) {
      if (now > window.resetAt) store.delete(key);
    }
  }, CLEANUP_INTERVAL_MS).unref?.(); // .unref() prevents blocking process exit
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;   // Unix ms timestamp when the window resets
  limit: number;
}

/**
 * Core rate limit check. Returns result — caller decides what to do.
 *
 * @param key       Unique key for this limit (e.g. `tenant:${id}:transactions`)
 * @param max       Maximum requests allowed per window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  max: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now > existing.resetAt) {
    // First request in a new window
    store.set(key, { count: 1, resetAt: now + windowMs });
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

/**
 * Pre-configured limiters for common scenarios.
 *
 * Tune these values based on observed traffic patterns.
 */
export const rateLimiters = {
  /** Public read endpoints — relatively generous */
  publicRead: (key: string) => checkRateLimit(key, 120, 60_000),        // 120/min

  /** Mutation endpoints on authenticated tenants */
  tenantMutation: (key: string) => checkRateLimit(key, 60, 60_000),     // 60/min

  /** Transaction creation — tighter limit, high business impact */
  transaction: (key: string) => checkRateLimit(key, 30, 60_000),        // 30/min

  /** Tenant onboarding (POST /tenants) — very tight */
  onboarding: (key: string) => checkRateLimit(key, 5, 60_000),          // 5/min per IP

  /** Customer access code lookup — prevent brute force */
  accessCodeLookup: (key: string) => checkRateLimit(key, 20, 60_000),   // 20/min per tenant
};

/**
 * Adds standard rate limit headers to a response.
 */
export function applyRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult
): NextResponse {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
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

  response.headers.set('Retry-After', String(retryAfterSec));
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', '0');
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));

  return response;
}
