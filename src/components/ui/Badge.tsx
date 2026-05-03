import type { ReactNode } from 'react';

type Color = 'indigo' | 'green' | 'amber' | 'gray';

const colorClasses: Record<Color, string> = {
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  green:  'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber:  'bg-amber-50 text-amber-700 ring-amber-200',
  gray:   'bg-gray-50 text-gray-600 ring-gray-200',
};

interface BadgeProps {
  children: ReactNode;
  color?: Color;
  className?: string;
}

export function Badge({ children, color = 'indigo', className = '' }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-xs font-semibold ring-1 ring-inset',
        colorClasses[color],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}
