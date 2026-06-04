'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion, useInView } from 'motion/react';
import { useRef, type ReactNode } from 'react';

const EASE = [0.23, 1, 0.32, 1] as [number, number, number, number];

type Direction = 'up' | 'left' | 'right' | 'scale' | 'fade';

const INITIAL: Record<Direction, any> = {
  up:    { opacity: 0, y: 36 },
  left:  { opacity: 0, x: -28 },
  right: { opacity: 0, x: 40 },
  scale: { opacity: 0, y: 28, scale: 0.94 },
  fade:  { opacity: 0 },
};
const VISIBLE: Record<Direction, any> = {
  up:    { opacity: 1, y: 0 },
  left:  { opacity: 1, x: 0 },
  right: { opacity: 1, x: 0 },
  scale: { opacity: 1, y: 0, scale: 1 },
  fade:  { opacity: 1 },
};

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: Direction;
  duration?: number;
  triggerMargin?: string;
}

export function Reveal({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.72,
  triggerMargin = '-64px',
}: RevealProps) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: `0px 0px ${triggerMargin} 0px` as any,
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={INITIAL[direction]}
      animate={inView ? VISIBLE[direction] : INITIAL[direction]}
      transition={{ duration, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Stagger container — children animate in sequence */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  triggerMargin = '-64px',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  triggerMargin?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, {
    once: true,
    margin: `0px 0px ${triggerMargin} 0px` as any,
  });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={{ visible: { transition: { staggerChildren: stagger } } }}
    >
      {children}
    </motion.div>
  );
}

/** Child of RevealGroup */
export function RevealItem({
  children,
  className,
  direction = 'up',
}: {
  children: ReactNode;
  className?: string;
  direction?: Direction;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: INITIAL[direction],
        visible: {
          ...VISIBLE[direction],
          transition: { duration: 0.65, ease: EASE },
        },
      }}
    >
      {children}
    </motion.div>
  );
}
