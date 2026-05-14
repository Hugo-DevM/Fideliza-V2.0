import { z } from 'zod';

export const CreateTenantSchema = z.object({
  name: z
    .string()
    .min(2, 'El nombre del negocio debe tener al menos 2 caracteres')
    .max(100, 'El nombre del negocio debe tener menos de 100 caracteres')
    .trim(),

  subdomain: z
    .string()
    .min(3, 'El subdominio debe tener al menos 3 caracteres')
    .max(63, 'El subdominio debe tener menos de 63 caracteres')
    .toLowerCase()
    .regex(
      /^[a-z0-9][a-z0-9\-]{1,61}[a-z0-9]$/,
      'Solo letras minúsculas, números y guiones (ej. "mi-cafe")'
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
    .refine((u) => u.startsWith('https://'), 'La URL debe usar HTTPS')
    .nullable()
    .optional(),
  is_active: z.boolean().optional(),
});

export const UpdateTenantSettingsSchema = z.object({
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hex válido (ej. #6366F1)')
    .optional(),
  secondary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Debe ser un color hex válido')
    .optional(),
  welcome_message: z.string().max(500).nullable().optional(),
  program_label: z.string().min(1).max(50).optional(),
  stamp_icon: z.string().min(1).max(50).optional(),
  terms_url: z
    .string()
    .url()
    .refine((u) => u.startsWith('https://'), 'La URL debe usar HTTPS')
    .nullable()
    .optional(),
});

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
export type UpdateTenantSettingsInput = z.infer<typeof UpdateTenantSettingsSchema>;
