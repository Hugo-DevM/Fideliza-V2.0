'use client';

import { useRouter, usePathname } from 'next/navigation';

const OPTIONS = [
  { label: '7 días', value: '7' },
  { label: '30 días', value: '30' },
  { label: 'Año', value: 'year' },
];

export default function PeriodSelector({ current }: { current: string }) {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] p-1 shadow-sm shrink-0">
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            onClick={() => router.push(`${pathname}?period=${o.value}`)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
