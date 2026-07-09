import type { Metadata } from 'next';
import { getDictionary } from '@/lib/i18n';
import { LandingShell } from '@/components/landing/LandingShell';

export const metadata: Metadata = {
  title: 'Fideliza — Programa de lealtad para tu negocio',
  description:
    'El sistema de retención completo para tu negocio: puntos, sellos, cashback, niveles VIP, referidos y campañas de WhatsApp. Sin que tus clientes descarguen una app — solo un código.',
  alternates: {
    canonical: 'https://fideliza.app/',
  },
};

export default async function RootPage() {
  const [dictEn, dictEs] = await Promise.all([
    getDictionary('en'),
    getDictionary('es'),
  ]);

  return <LandingShell dictEn={dictEn} dictEs={dictEs} />;
}
