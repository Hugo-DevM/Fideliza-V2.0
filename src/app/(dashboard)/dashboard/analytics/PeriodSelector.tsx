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
    <div className="flex items-center w-full rounded-xl border border-gray-200 dark:border-[#1e2438] bg-gray-100 dark:bg-[#0d0f17] p-1 shrink-0">
      {OPTIONS.map((o) => {
        const active = current === o.value;
        return (
          <button
            key={o.value}
            onClick={() => router.push(`${pathname}?period=${o.value}`)}
            className={`flex-1 rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              active
                ? 'bg-white dark:bg-[#1e2438] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-[#2a3147]'
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
