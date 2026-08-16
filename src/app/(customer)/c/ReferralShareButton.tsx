'use client';

import { useState } from 'react';

interface ReferralShareButtonProps {
  /** Relative path — origin is prepended client-side */
  path: string;
  code: string;
  businessName: string;
  /** Already formatted for the program type, e.g. "3 sellos" or "$10.00". */
  bonusText: string;
}

export default function ReferralShareButton({
  path, code, businessName, bonusText,
}: ReferralShareButtonProps) {
  const [copied, setCopied] = useState(false);

  /**
   * The two ways to redeem an invitation are genuinely different, so the message
   * spells out both instead of blurring them:
   *   - the link applies the code by itself, nothing to type
   *   - at the counter the cashier types the code, so it has to be readable
   *
   * `*code*` renders bold in WhatsApp. Elsewhere (SMS, notes) the asterisks show
   * literally — an accepted trade-off, since WhatsApp is where these are shared.
   */
  function buildMessage(url: string): string {
    return (
      `¡Hola! Te invito a ${businessName} 🎁\n\n` +
      `Regístrate aquí y tus ${bonusText} de regalo se aplican solos:\n${url}\n\n` +
      `¿Prefieres ir directo? Menciona mi código en caja:\n*${code}*`
    );
  }

  async function handleShare() {
    const url = window.location.origin + path;
    const message = buildMessage(url);

    // The URL goes inside `text` rather than in the separate `url` field:
    // share targets combine the two inconsistently and some drop one of them.
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete al programa de ${businessName}`,
          text: message,
        });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    try {
      // Copy the whole message, not just the link. Copying the bare URL left
      // the sender to explain the invitation themselves.
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no-op
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="shrink-0 flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 px-3 py-2 text-xs font-semibold text-white transition-colors"
    >
      {copied ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copiado
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
          </svg>
          Compartir
        </>
      )}
    </button>
  );
}
