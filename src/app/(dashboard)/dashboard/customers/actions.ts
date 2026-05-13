'use server';

import { revalidatePath } from 'next/cache';
import { getAuthenticatedTenant } from '@/lib/auth/get-tenant';
import { createCustomer } from '@/modules/customers';

export async function createCustomerAction(formData: FormData) {
  const { tenantId } = await getAuthenticatedTenant();

  const name  = (formData.get('name')  as string | null)?.trim() ?? '';
  const phone = (formData.get('phone') as string | null)?.trim() || null;
  const notes = (formData.get('notes') as string | null)?.trim() || null;

  if (!name) return { error: 'El nombre es obligatorio.' };

  try {
    const customer = await createCustomer(tenantId, { name, phone, notes });
    revalidatePath('/dashboard/customers');
    return { success: true, customerId: customer.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'No se pudo crear el cliente.' };
  }
}
