'use client';

/**
 * Resends the customer their personal card link.
 *
 * Deliberately NOT a Meta template send: it opens the owner's own WhatsApp with
 * the message prefilled, and they press send. That means no template approval,
 * no Twilio cost, no monthly quota — so it works on the Free plan too, which is
 * exactly where a business is most likely to be when a customer says "I lost
 * the link".
 *
 * Falls back to copying when the customer has no phone on file.
 */

import { useState } from 'react';
import {
  portalUrlForCustomer,
  whatsappShareLink,
  accessLinkMessage,
} from '@/lib/portal/url';

interface Props {
  customerName: string;
  businessName: string;
  accessCode:   string;
  subdomain:    string;
  phone:        string | null;
}

export default function ShareAccessLinkButton({
  customerName, businessName, accessCode, subdomain, phone,
}: Props) {
  const [copied, setCopied] = useState(false);

  const url     = portalUrlForCustomer(subdomain, accessCode);
  const message = accessLinkMessage({ customerName, businessName, accessCode, url });

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the link is visible in the card anyway */ }
  }

  return (
    <div className="flex gap-2">
      {phone && (
        <a
          href={whatsappShareLink(phone, message)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
          </svg>
          Enviar liga
        </a>
      )}

      <button
        type="button"
        onClick={copyLink}
        className={`${phone ? '' : 'flex-1 '}inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 transition hover:text-indigo-600 dark:hover:text-indigo-400 active:scale-95`}
        aria-label="Copiar la liga de acceso del cliente"
      >
        {copied ? (
          <svg className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
          </svg>
        )}
        {copied ? 'Copiada' : 'Copiar liga'}
      </button>
    </div>
  );
}
