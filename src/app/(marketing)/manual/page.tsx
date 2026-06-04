import type { Metadata } from "next";
import { ManualClient } from "./ManualClient";

export const metadata: Metadata = {
  title: "Manual de Usuario / User Manual",
  description:
    "Guía completa para usar Fideliza+: programas de puntos, sellos, visitas y cashback.",
};

export default function ManualPage() {
  return <ManualClient />;
}
