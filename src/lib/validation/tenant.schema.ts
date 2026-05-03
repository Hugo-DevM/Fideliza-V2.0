import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z
    .string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name must be under 100 characters')
    .trim(),

  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must be under 63 characters')
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/,
      'Subdomain must be lowercase alphanumeric with hyphens (e.g. "my-coffee-shop")'
    ),

  email: z
    .string()
    .email('Must be a valid email address')
    .toLowerCase()
    .max(255),

  plan: z
    .enum(['free', 'starter', 'pro', 'enterprise'])
    .optional()
    .default('free'),
});

export const UpdateTenantSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  logo_url: z
    .string()
    .url('Must be a valid URL')
    .refine((u) => u.startsWith('https://'), 'URL must use HTTPS')
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

export const UpdateTenantSettingsSchema = z.object({
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color (e.g. #6366F1)')
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .optional(),
  welcome_message: z.string().max(500).nullable().optional(),
  program_label: z.string().min(1).max(50).optional(),
  stamp_icon: z.string().min(1).max(50).optional(),
  terms_url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'URL must use HTTPS')
    .nullable()
    .optional(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type UpdateTenantSettingsInput = z.infer<typeof UpdateTenantSettingsSchema>;
