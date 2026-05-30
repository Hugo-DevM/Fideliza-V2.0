'use client';

import { useEffect, useState } from 'react';

const copy = {
  es: {
    message:
      'Usamos cookies de terceros (Meta Pixel) para medir el rendimiento de nuestras campañas publicitarias. Puedes aceptar o rechazar su uso.',
    accept: 'Aceptar',
    decline: 'Rechazar',
    policy: 'Política de privacidad',
  },
  en: {
    message:
      'We use third-party cookies (Meta Pixel) to measure the performance of our advertising campaigns. You can accept or decline their use.',
    accept: 'Accept',
    decline: 'Decline',
    policy: 'Privacy policy',
  },
};

export function CookieBanner({ lang }: { lang: string }) {
  const [visible, setVisible] = useState(false);
  const t = lang === 'es' ? copy.es : copy.en;
  const privacyHref = `/${lang}/privacy`;

  useEffect(() => {
    if (!localStorage.getItem('cookie_consent')) setVisible(true);
  }, []);

  if (!visible) return null;

  function accept() {
    localStorage.setItem('cookie_consent', 'accepted');
    window.dispatchEvent(new Event('cookie_consent_accepted'));
    setVisible(false);
  }

  function decline() {
    localStorage.setItem('cookie_consent', 'declined');
    setVisible(false);
  }

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={lang === 'es' ? 'Aviso de cookies' : 'Cookie notice'}
      className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 flex justify-center"
    >
      <div className="w-full max-w-2xl bg-gray-900 border border-white/10 rounded-xl shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        <p className="text-sm text-gray-300 flex-1">
          {t.message}{' '}
          <a
            href={privacyHref}
            className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300 transition-colors"
          >
            {t.policy}
          </a>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={decline}
            className="px-4 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-colors"
          >
            {t.decline}
          </button>
          <button
            onClick={accept}
            className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
