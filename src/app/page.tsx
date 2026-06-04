import { getDictionary } from '@/lib/i18n';
import { LandingShell } from '@/components/landing/LandingShell';

export const metadata = {
  title: 'Fideliza+ — Programa de lealtad para tu negocio',
  description: 'Crea programas de puntos, sellos, visitas y cashback. Fideliza a tus clientes con Fideliza+.',
};

export default async function RootPage() {
  const [dictEn, dictEs] = await Promise.all([
    getDictionary('en'),
    getDictionary('es'),
  ]);

  return <LandingShell dictEn={dictEn} dictEs={dictEs} />;
}
