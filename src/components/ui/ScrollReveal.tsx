'use client';

import { useEffect } from 'react';

const SELECTORS = [
  '.reveal',
  '.reveal-left',
  '.reveal-right',
  '.reveal-scale',
  '.reveal-heading',
  '.line-draw',
  '.section-reveal',
].join(', ');

/**
 * Attaches an IntersectionObserver to every animated element on the page.
 * CSS handles the animation — this just toggles .in-view.
 *
 * Pass `deps` to re-run the observer when values change (e.g. on lang switch).
 */
export function ScrollReveal({ deps = [] }: { deps?: unknown[] }) {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(SELECTORS);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -48px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return null;
}
