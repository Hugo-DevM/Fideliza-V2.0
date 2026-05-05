"use client";

import { useEffect, useState } from "react";

const TOC = [
  { id: "introduccion", label: "1. Introducción" },
  { id: "primeros-pasos", label: "2. Primeros pasos" },
  { id: "navegacion", label: "3. Navegación" },
  { id: "dashboard", label: "4.1 Dashboard" },
  { id: "clientes", label: "4.2 Clientes" },
  { id: "programas", label: "4.3 Programas" },
  { id: "recompensas", label: "4.4 Recompensas" },
  { id: "portal-cliente", label: "4.5 Portal del cliente" },
  { id: "configuracion", label: "4.6 Configuración y marca" },
  { id: "facturacion", label: "4.7 Facturación" },
  { id: "registro-rapido", label: "4.8 Registro rápido" },
  { id: "planes", label: "5. Planes" },
  { id: "errores", label: "6. Errores y validaciones" },
  { id: "buenas-practicas", label: "7. Buenas prácticas" },
  { id: "faq", label: "8. FAQ" },
];

export function TocNav() {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const elements = TOC.map(({ id }) => document.getElementById(id)).filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-64px 0px -60% 0px",
        threshold: 0,
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <aside className="hidden lg:block w-56 flex-shrink-0 self-start sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Contenido
      </p>
      <nav className="space-y-0.5">
        {TOC.map(({ id, label }) => {
          const isActive = activeId === id;
          return (
            <a
              key={id}
              href={`#${id}`}
              className={[
                "flex items-center gap-2 text-sm py-1 px-2 rounded transition-colors",
                isActive
                  ? "text-white bg-white/10 font-medium"
                  : "text-gray-400 hover:text-white hover:bg-white/5",
              ].join(" ")}
            >
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
              )}
              <span className={isActive ? "" : "pl-3"}>{label}</span>
            </a>
          );
        })}
      </nav>
    </aside>
  );
}
