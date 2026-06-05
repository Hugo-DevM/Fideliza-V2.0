import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de Servicio | Fideliza',
  description:
    'Lee los términos y condiciones que rigen el uso de la plataforma Fideliza.',
  alternates: {
    canonical: 'https://fideliza.app/terms',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
