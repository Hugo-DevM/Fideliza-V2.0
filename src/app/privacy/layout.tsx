import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Fideliza',
  description:
    'Conoce cómo Fideliza recopila, usa y protege la información personal de negocios y clientes finales.',
  alternates: {
    canonical: 'https://fideliza.app/privacy',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
