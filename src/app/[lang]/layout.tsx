import { notFound } from 'next/navigation';
import { isValidLocale } from '@/lib/i18n';

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'es' }];
}

export default async function LangLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();
  return <>{children}</>;
}
