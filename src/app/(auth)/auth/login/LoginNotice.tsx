'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  message: string;
  variant?: 'error' | 'warning';
}

export default function LoginNotice({ message, variant = 'error' }: Props) {
  const [mounted,  setMounted]  = useState(true);
  const [visible,  setVisible]  = useState(false);
  const unmountRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));

    // Auto-dismiss after 3s
    const auto = setTimeout(() => {
      setVisible(false);
      unmountRef.current = setTimeout(() => setMounted(false), 400);
    }, 3000);

    return () => {
      clearTimeout(auto);
      if (unmountRef.current) clearTimeout(unmountRef.current);
    };
  }, []);

  if (!mounted) return null;

  const colors = variant === 'warning'
    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
    : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400';

  return (
    <div style={{
      display: 'grid',
      gridTemplateRows: visible ? '1fr' : '0fr',
      transition: 'grid-template-rows 350ms ease',
      marginBottom: visible ? '1.25rem' : '0',
    }}>
      <div style={{ overflow: 'hidden' }}>
        <p
          className={`rounded-xl border px-4 py-3 text-sm leading-snug ${colors}`}
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(-4px)',
            transition: 'opacity 280ms ease, transform 280ms ease',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  );
}
