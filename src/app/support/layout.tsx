import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Soporte | Fideliza',
  description:
    'Centro de soporte de Fideliza. Encuentra respuestas a tus preguntas o contáctanos directamente.',
  alternates: {
    canonical: 'https://fideliza.app/support',
  },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
