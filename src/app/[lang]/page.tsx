import { redirect } from 'next/navigation';
import { isValidLocale, locales } from '@/lib/i18n';

interface Props {
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** /en and /es now redirect to the language-agnostic landing at / */
export default async function LangLandingRedirect({ params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) redirect('/');
  redirect('/');
}
