import { redirect } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n';

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LangPrivacyRedirect({ params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) redirect('/privacy');
  redirect('/privacy');
}
