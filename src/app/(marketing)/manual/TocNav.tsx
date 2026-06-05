"use client";

import { useEffect, useState } from "react";

export interface TocItem {
  id: string;
  label: string;
}

export function TocNav({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const elements = items
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
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
  }, [items]);

  return (
    <aside className="hidden lg:block w-56 flex-shrink-0 self-start sticky top-16 max-h-[calc(100vh-5rem)] overflow-y-auto">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Contents
      </p>
      <nav className="space-y-0.5">
        {items.map(({ id, label }) => {
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
