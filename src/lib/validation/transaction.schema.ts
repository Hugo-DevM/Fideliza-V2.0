import { z } from 'zod';

const UUID = z.string().uuid('Must be a valid UUID');

export const CreateTransactionSchema = z
  .object({
    customer_id: UUID,
    program_id:  UUID,
    type: z.enum(['earn', 'redeem', 'expire', 'adjustment', 'refund']),
    points_delta: z
      .number()
      .int('Points must be a whole number')
      .refine((n) => n !== 0, { message: 'Points delta must be non-zero' }),
    note: z.string().max(500).nullable().optional(),
    staff_id: UUID.nullable().optional(),
  })
  .refine(
    (data) => {
      // 'earn' must be positive; 'redeem' and 'expire' must be negative
      if (data.type === 'earn' && data.points_delta <= 0) return false;
      if (data.type === 'redeem' && data.points_delta >= 0) return false;
      if (data.type === 'expire' && data.points_delta >= 0) return false;
      return true;
    },
    {
      message:
        'points_delta direction must match transaction type (earn=positive, redeem/expire=negative)',
      path: ['points_delta'],
    }
  );

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;
