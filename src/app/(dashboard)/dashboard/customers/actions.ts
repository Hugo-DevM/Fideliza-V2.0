'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createCustomer, updateCustomer } from '@/modules/customers';

export async function createCustomerAction(formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();

  const name             = (formData.get('name')  as string | null)?.trim() ?? '';
  const phone            = (formData.get('phone') as string | null)?.trim() || null;
  const notes            = (formData.get('notes') as string | null)?.trim() || null;
  const whatsapp_opt_in  = formData.get('whatsapp_opt_in') === 'true';

  if (!name)  return { error: 'El nombre es obligatorio.' };
  if (!phone) return { error: 'El teléfono es obligatorio.' };

  try {
    const customer = await createCustomer(tenantId, { name, phone, notes, whatsapp_opt_in });
    revalidateTag('customers', 'max');
    revalidatePath('/dashboard/customers');
    revalidatePath('/dashboard');
    return { success: true, customerId: customer.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo crear el cliente.' };
  }
}

export async function updateCustomerAction(formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();

  const customerId = (formData.get('customerId') as string | null) ?? '';
  const name  = (formData.get('name')  as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() || null;
  const notes = (formData.get('notes') as string | null)?.trim() || null;

  if (!customerId) return { error: 'ID de cliente inválido.' };
  if (!name)       return { error: 'El nombre es obligatorio.' };

  try {
    await updateCustomer(tenantId, customerId, { name, phone, notes });
    revalidateTag('customers', 'max');
    revalidatePath(`/dashboard/customers/${customerId}`);
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo actualizar el cliente.' };
  }
}
