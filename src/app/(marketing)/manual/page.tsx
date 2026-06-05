import type { Metadata } from "next";
import { ManualClient } from "./ManualClient";

export const metadata: Metadata = {
  title: "Manual de Usuario | Fideliza",
  description:
    "Guía completa para usar Fideliza: programas de puntos, sellos, visitas y cashback. Basado en la implementación real del sistema.",
  alternates: {
    canonical: 'https://fideliza.app/manual',
  },
};

export default function ManualPage() {
  return <ManualClient />;
}
