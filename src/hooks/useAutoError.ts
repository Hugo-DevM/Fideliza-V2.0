'use client';

import { useState, useRef, useEffect } from 'react';
import type { CSSProperties } from 'react';

const VISIBLE: CSSProperties = {
  opacity: 1,
  transform: 'translateY(0)',
  transition: 'opacity 280ms ease, transform 280ms ease',
};
const HIDDEN: CSSProperties = {
  opacity: 0,
  transform: 'translateY(-4px)',
  transition: 'opacity 280ms ease, transform 280ms ease',
};

/**
 * Manages an error string that auto-clears after `duration` ms.
 * Animates in (fade + slide-down) and out (fade + slide-up + height collapse)
 * so the surrounding card shrinks smoothly instead of snapping.
 *
 * Usage:
 *   const { setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
 *   {mounted && (
 *     <div style={wrapperStyle}>
 *       <div style={{ overflow: 'hidden' }}>
 *         <p style={errorStyle} className="...">{displayText}</p>
 *       </div>
 *     </div>
 *   )}
 */
export function useAutoError(duration = 3000) {
  const [error,       setErrorState] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [mounted,     setMounted]    = useState(false);
  const [visible,     setVisible]    = useState(false);

  const autoRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjust state during render when `error` changes
  // (react.dev "You Might Not Need an Effect").
  const [prevError, setPrevError] = useState(error);
  if (prevError !== error) {
    setPrevError(error);
    if (error) {
      setDisplayText(error);
      setMounted(true);
    } else {
      setVisible(false);
    }
  }

  useEffect(() => {
    if (!error) {
      if (unmountRef.current) clearTimeout(unmountRef.current);
      // Keep element mounted until height animation finishes, then remove
      unmountRef.current = setTimeout(() => {
        setMounted(false);
        setDisplayText('');
      }, 400);
      return;
    }

    if (unmountRef.current) clearTimeout(unmountRef.current);
    requestAnimationFrame(() => setVisible(true));

    if (autoRef.current) clearTimeout(autoRef.current);
    autoRef.current = setTimeout(() => {
      setVisible(false);
      if (clearRef.current) clearTimeout(clearRef.current);
      clearRef.current = setTimeout(() => setErrorState(''), 350);
    }, duration);

    return () => {
      if (autoRef.current) clearTimeout(autoRef.current);
    };
  }, [error, duration]);

  return {
    error,
    setError: setErrorState,
    mounted,
    displayText,
    wrapperStyle: {
      display: 'grid',
      gridTemplateRows: visible ? '1fr' : '0fr',
      transition: 'grid-template-rows 350ms ease',
    } as CSSProperties,
    errorStyle: (visible ? VISIBLE : HIDDEN) as CSSProperties,
  };
}
