/**
 * POST /api/transactions — Record an earn/adjustment/expire/refund transaction.
 * GET  /api/transactions — List transactions (customer_id required).
 */
import { NextResponse } from 'next/server';
import { withTenantContext } from '@/lib/middleware/api-context';
import { parseBody, zodError } from '@/lib/validation';
import { CreateTransactionSchema } from '@/lib/validation/transaction.schema';
import { processTransaction, getCustomerTransactionHistory } from '@/modules/transactions';
import { BadRequestError } from '@/lib/middleware/errors';
import type { ApiResponse, Transaction, PaginatedResponse } from '@/lib/types';

export const POST = withTenantContext<Transaction>(async (request, _ctx, tenant) => {
  const { body, error: bodyError } = await parseBody(request);
  if (bodyError) return bodyError;

  const parsed = CreateTransactionSchema.safeParse(body);
  const ve = zodError(parsed);
  if (ve) return ve;
  if (!parsed.success) return ve!;

  if (parsed.data.type === 'redeem') {
    return NextResponse.json<ApiResponse<null>>(
      { data: null, error: 'Use POST /api/rewards/redeem for reward redemptions' },
      { status: 400 }
    );
  }

  const transaction = await processTransaction(tenant.tenantId, parsed.data);
  return NextResponse.json<ApiResponse<Transaction>>(
    { data: transaction, error: null }, { status: 201 }
  );
}, { limiter: 'transaction', endpoint: 'POST:/api/transactions' });

export const GET = withTenantContext<Transaction[]>(async (request, _ctx, tenant) => {
  const url = new URL(request.url);
  const customerId = url.searchParams.get('customer_id');
  const programId  = url.searchParams.get('program_id') ?? undefined;
  const page  = Math.max(1, parseInt(url.searchParams.get('page')  ?? '1',  10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '50', 10)));

  if (!customerId) throw new BadRequestError('customer_id query parameter is required');

  const { transactions, total } = await getCustomerTransactionHistory(
    tenant.tenantId, customerId, programId, page, limit
  );
  return NextResponse.json<PaginatedResponse<Transaction>>(
    { data: transactions, total, page, limit, error: null }, { status: 200 }
  );
}, { limiter: 'publicRead', endpoint: 'GET:/api/transactions' });
