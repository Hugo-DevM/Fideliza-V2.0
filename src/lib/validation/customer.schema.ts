import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(150, 'Name must be under 150 characters')
    .trim(),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{6,14}$/,
      'Must be a valid international phone number (e.g. +15551234567)'
    )
    .nullable()
    .optional(),

  notes: z.string().max(1000).nullable().optional(),
});

export const UpdateCustomerSchema = z.object({
  name: z.string().min(1).max(150).trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{6,14}$/)
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export const LookupCustomerSchema = z.object({
  code: z
    .string()
    .min(6, 'Access code must be at least 6 characters')
    .max(20, 'Access code too long')
    .toUpperCase()
    .trim(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type LookupCustomerInput = z.infer<typeof LookupCustomerSchema>;
