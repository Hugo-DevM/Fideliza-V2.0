'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function verifyAdminSecret(formData: FormData) {
  const input = (formData.get('secret') as string | null)?.trim() ?? '';
  const expected = process.env.ADMIN_SECRET;

  if (!expected || input !== expected) {
    redirect('/admin/verify?error=1');
  }

  const jar = await cookies();
  jar.set('admin_verified', expected, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 60 * 60 * 8, // 8 horas
  });

  redirect('/admin');
}
