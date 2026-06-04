import type { ReactNode } from 'react';

/**
 * Wraps standalone brand name "Fideliza" in a styled element.
 * Safe to use with strings that contain "fideliza.app" URLs — those use
 * lowercase so they won't be matched.
 */
export function withBrand(
  text: string,
  className = 'font-bold text-gray-900',
): ReactNode {
  const parts = text.split(/(Fideliza)/);
  return parts.map((part, i) =>
    part === 'Fideliza' ? (
      <strong key={i} className={className}>
        {part}
      </strong>
    ) : (
      part
    ),
  );
}
