/**
 * Shared validation utilities used by all API route handlers.
 */

import { NextResponse } from 'next/server';
import type { ZodSafeParseResult } from 'zod';
import type { ApiResponse } from '@/lib/types';

/**
 * Formats a Zod parse failure into a 422 NextResponse.
 * Centralises the ZodIssue path/message shape so route handlers
 * don't need to import ZodIssue themselves.
 */
export function zodError(
  result: ZodSafeParseResult<unknown>
): NextResponse<ApiResponse<null>> | null {
  if (result.success) return null;

  const message = (result.error.issues as Array<{ path: PropertyKey[]; message: string }>)
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join('.') + ': ' : '';
      return `${path}${issue.message}`;
    })
    .join('; ');

  return NextResponse.json<ApiResponse<null>>(
    { data: null, error: message },
    { status: 422 }
  );
}

/**
 * Parses a JSON body and returns a 400 response if parsing fails.
 */
export async function parseBody(request: Request): Promise<{ body: unknown; error: null } | { body: null; error: NextResponse<ApiResponse<null>> }> {
  try {
    const body = await request.json();
    return { body, error: null };
  } catch {
    return {
      body: null,
      error: NextResponse.json<ApiResponse<null>>(
        { data: null, error: 'Invalid JSON body' },
        { status: 400 }
      ),
    };
  }
}
