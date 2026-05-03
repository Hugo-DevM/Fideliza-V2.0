/**
 * Typed API error classes and a centralised error-to-response converter.
 * All API route handlers should throw these instead of returning raw objects.
 */

import { NextResponse } from 'next/server';
import type { ApiResponse } from '@/lib/types';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class BadRequestError extends ApiError {
  constructor(message: string) {
    super(message, 400, 'BAD_REQUEST');
    this.name = 'BadRequestError';
  }
}

export class TenantNotFoundError extends ApiError {
  constructor(subdomain: string) {
    super(`Tenant "${subdomain}" not found or inactive`, 404, 'TENANT_NOT_FOUND');
    this.name = 'TenantNotFoundError';
  }
}

/**
 * Wraps an API route handler with error handling.
 * Usage:
 *   export const GET = withErrorHandler(async (req) => { ... });
 */
export function withErrorHandler<T>(
  handler: (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse<ApiResponse<T>>>
) {
  return async (req: Request, ctx: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json<ApiResponse<null>>(
          { data: null, error: err.message },
          { status: err.statusCode }
        );
      }

      // Unexpected error — log server-side, return generic message to client
      console.error('[API Error]', err);
      return NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
