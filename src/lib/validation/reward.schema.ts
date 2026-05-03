import { z } from 'zod';

const UUID = z.string().uuid('Must be a valid UUID');

// ── Per-type program config schemas ──────────────────────────────────────────
// Strict typing prevents mis-configured programs and calculation bugs.

export const PointsConfigSchema = z.object({
  points_per_dollar: z
    .number()
    .int()
    .min(1, 'Must award at least 1 point per dollar')
    .max(10_000, 'Cannot exceed 10,000 points per dollar'),
  min_redeem: z
    .number()
    .int()
    .min(1, 'Minimum redeem must be at least 1')
    .max(1_000_000)
    .optional()
    .default(0),
});

export const StampConfigSchema = z.object({
  stamps_needed: z
    .number()
    .int()
    .min(2, 'A stamp card must require at least 2 stamps')
    .max(100, 'Cannot exceed 100 stamps per card'),
});

export const VisitConfigSchema = z.object({
  visits_needed: z
    .number()
    .int()
    .min(2, 'A visit program must require at least 2 visits')
    .max(500, 'Cannot exceed 500 visits'),
});

export const CashbackConfigSchema = z.object({
  cashback_percent: z
    .number()
    .min(0.1, 'Cashback must be at least 0.1%')
    .max(50, 'Cashback cannot exceed 50%'),
  min_purchase_cents: z
    .number()
    .int()
    .min(0)
    .max(100_000_00, 'Minimum purchase cannot exceed $100,000')
    .optional()
    .default(0),
});

// Union discriminated by program type — validated when program type is known
export type PointsConfig   = z.infer<typeof PointsConfigSchema>;
export type StampConfig    = z.infer<typeof StampConfigSchema>;
export type VisitConfig    = z.infer<typeof VisitConfigSchema>;
export type CashbackConfig = z.infer<typeof CashbackConfigSchema>;

/**
 * Validates config object for the given program type.
 * Returns a Zod error message string on failure, null on success.
 */
export function validateProgramConfig(
  type: 'points' | 'stamp' | 'visit' | 'cashback',
  config: unknown
): string | null {
  const schemas = {
    points:   PointsConfigSchema,
    stamp:    StampConfigSchema,
    visit:    VisitConfigSchema,
    cashback: CashbackConfigSchema,
  } as const;

  const result = schemas[type].safeParse(config);
  if (result.success) return null;

  return result.error.issues
    .map((i) => (i.path.length ? `${i.path.join('.')}: ` : '') + i.message)
    .join('; ');
}

// ── HTTPS-only URL helper ──────────────────────────────────────────────────
// Prevents HTTP mixed-content and reduces SSRF surface area.
const httpsUrl = z
  .string()
  .url('Must be a valid URL')
  .refine((url) => url.startsWith('https://'), 'URL must use HTTPS')
  .nullable()
  .optional();

// ── Reward program schemas ─────────────────────────────────────────────────

export const CreateRewardProgramSchema = z.object({
  name: z.string().min(2).max(150).trim(),
  description: z.string().max(500).nullable().optional(),
  type: z.enum(['points', 'stamp', 'visit', 'cashback']),
  config: z.record(z.string(), z.unknown()),
  max_enrollments: z.number().int().positive().nullable().optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
})
.refine(
  (data) => !data.starts_at || !data.ends_at || data.starts_at < data.ends_at,
  { message: 'ends_at must be after starts_at', path: ['ends_at'] }
)
.superRefine((data, ctx) => {
  const err = validateProgramConfig(data.type, data.config);
  if (err !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err ?? 'Invalid config',
      path: ['config'],
    });
  }
});

export const CreateRewardSchema = z.object({
  program_id:   UUID,
  name:         z.string().min(2).max(150).trim(),
  description:  z.string().max(500).nullable().optional(),
  image_url:    httpsUrl,
  cost_points:  z.number().int().positive('Points cost must be a positive integer'),
  stock:        z.number().int().nonnegative().nullable().optional(),
  expiry_days:  z.number().int().positive().nullable().optional(),
});

export const RedeemRewardSchema = z.object({
  customer_id:   UUID,
  reward_id:     UUID,
  enrollment_id: UUID,
  note:          z.string().max(500).nullable().optional(),
});

export const UpdateRewardProgramSchema = z.object({
  name:            z.string().min(2).max(150).trim().optional(),
  description:     z.string().max(500).nullable().optional(),
  status:          z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  // type is required alongside config to validate the config shape
  type:            z.enum(['points', 'stamp', 'visit', 'cashback']).optional(),
  config:          z.record(z.string(), z.unknown()).optional(),
  max_enrollments: z.number().int().positive().nullable().optional(),
  starts_at:       z.string().datetime().nullable().optional(),
  ends_at:         z.string().datetime().nullable().optional(),
})
.refine(
  (data) => !data.starts_at || !data.ends_at || data.starts_at < data.ends_at,
  { message: 'ends_at must be after starts_at', path: ['ends_at'] }
)
.superRefine((data, ctx) => {
  if (!data.config || !data.type) return;
  const err = validateProgramConfig(data.type, data.config);
  if (err !== null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: err ?? 'Invalid config',
      path: ['config'],
    });
  }
});

export const UpdateRewardSchema = z.object({
  name:        z.string().min(2).max(150).trim().optional(),
  description: z.string().max(500).nullable().optional(),
  image_url:   httpsUrl,
  cost_points: z.number().int().positive().optional(),
  stock:       z.number().int().nonnegative().nullable().optional(),
  expiry_days: z.number().int().positive().nullable().optional(),
  is_active:   z.boolean().optional(),
});

export const EnrollCustomerSchema = z.object({
  customer_id: UUID,
  program_id:  UUID,
});

export const ListEnrollmentsQuerySchema = z.object({
  customer_id: UUID.optional(),
  program_id:  UUID.optional(),
  page:        z.coerce.number().int().positive().optional().default(1),
  limit:       z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const ListRewardsQuerySchema = z.object({
  program_id: UUID.optional(),
  page:       z.coerce.number().int().positive().optional().default(1),
  limit:      z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type CreateRewardProgramInput  = z.infer<typeof CreateRewardProgramSchema>;
export type UpdateRewardProgramInput  = z.infer<typeof UpdateRewardProgramSchema>;
export type CreateRewardInput         = z.infer<typeof CreateRewardSchema>;
export type UpdateRewardInput         = z.infer<typeof UpdateRewardSchema>;
export type RedeemRewardInput         = z.infer<typeof RedeemRewardSchema>;
export type EnrollCustomerInput       = z.infer<typeof EnrollCustomerSchema>;
export type ListEnrollmentsQueryInput = z.infer<typeof ListEnrollmentsQuerySchema>;
export type ListRewardsQueryInput     = z.infer<typeof ListRewardsQuerySchema>;
