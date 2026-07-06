'use client';

import { useState, useEffect } from 'react';

/**
 * Keeps a modal mounted during its exit animation so CSS transitions play fully.
 *
 * Usage:
 *   const { mounted, visible } = useModalTransition(open);
 *   {mounted && (
 *     <div style={{ opacity: visible ? 1 : 0, transition: 'opacity 220ms ease' }}>
 *       ...
 *     </div>
 *   )}
 */
export function useModalTransition(open: boolean, duration = 220) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);

  // Adjust state during render (react.dev "You Might Not Need an Effect"):
  // mount immediately when opening; start fading out immediately when closing.
  if (open && !mounted) setMounted(true);
  if (!open && visible) setVisible(false);

  useEffect(() => {
    if (open) {
      // Double RAF: first frame mounts the node at its initial (invisible) state,
      // second frame triggers the transition so the browser actually animates it.
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      const t = setTimeout(() => setMounted(false), duration);
      return () => clearTimeout(t);
    }
  }, [open, duration]);

  return { mounted, visible };
}
