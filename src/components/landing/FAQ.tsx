'use client';

import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/Reveal';
import type { Dictionary } from '@/lib/i18n';

interface FAQProps {
  t: Dictionary['faq'];
}

export function FAQ({ t }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section id="faq" className="py-20 sm:py-28 bg-white">
      <Container>
        <div className="text-center mb-12">
          <Reveal direction="left" className="mb-3">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">{t.label}</p>
          </Reveal>
          <Reveal delay={0.06}>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t.heading}</h2>
          </Reveal>
          <Reveal delay={0.12}>
            <p className="text-lg text-gray-500 max-w-xl mx-auto">{t.body}</p>
          </Reveal>
        </div>

        <RevealGroup className="max-w-2xl mx-auto divide-y divide-gray-100" stagger={0.06}>
          {t.items.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <RevealItem key={i} direction="up">
                <button
                  onClick={() => toggle(i)}
                  className="flex w-full items-start justify-between gap-6 py-5 text-left"
                  aria-expanded={isOpen}
                >
                  <span className={`text-base font-semibold leading-snug transition-colors ${isOpen ? 'text-indigo-600' : 'text-gray-900'}`}>
                    {item.question}
                  </span>
                  <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                    isOpen
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600 rotate-45'
                      : 'border-gray-200 bg-gray-50 text-gray-400'
                  }`}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </span>
                </button>

                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.answer}</p>
                </div>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </Container>
    </section>
  );
}
