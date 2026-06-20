import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  name: z
    .string()
    .min(1, 'El nombre es obligatorio')
    .max(150, 'El nombre debe tener menos de 150 caracteres')
    .trim(),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{6,14}$/,
      'Debe ser un número de teléfono válido'
    )
    .nullable()
    .optional(),

  notes: z.string().max(1000).nullable().optional(),
  whatsapp_opt_in: z.boolean().optional().default(false),
  birth_month: z.number().int().min(1).max(12).nullable().optional(),
  birth_day:   z.number().int().min(1).max(31).nullable().optional(),
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
  birth_month: z.number().int().min(1).max(12).nullable().optional(),
  birth_day:   z.number().int().min(1).max(31).nullable().optional(),
});

export const LookupCustomerSchema = z.object({
  code: z
    .string()
    .min(6, 'El código de acceso debe tener al menos 6 caracteres')
    .max(20, 'El código de acceso es demasiado largo')
    .toUpperCase()
    .trim(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;
export type LookupCustomerInput = z.infer<typeof LookupCustomerSchema>;
