'use client';

import { useState } from 'react';

interface PortalCardProps {
  subdomain: string;
}

export default function PortalCard({ subdomain }: PortalCardProps) {
  const url = `https://${subdomain}.fideliza.app/c`;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-5 relative overflow-hidden">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/5" />
      <div className="absolute -right-2 -bottom-8 h-32 w-32 rounded-full bg-white/5" />

      <div className="relative flex items-start justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-indigo-200">
          Portal de clientes
        </p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/15 hover:bg-white/25 transition"
          title="Abrir portal"
        >
          <LinkIcon className="h-3.5 w-3.5 text-white" />
        </a>
      </div>

      <p className="relative text-lg font-bold text-white mb-3">Comparte tu enlace</p>

      <div className="relative flex items-center gap-2 rounded-xl bg-white/15 px-3 py-2 mb-3">
        <span className="flex-1 truncate font-mono text-xs text-indigo-100">{url}</span>
        <button
          onClick={handleCopy}
          className="shrink-0 transition hover:text-white"
          title={copied ? 'Copiado' : 'Copiar enlace'}
        >
          {copied
            ? <CheckIcon className="h-3.5 w-3.5 text-emerald-300" />
            : <CopyIcon className="h-3.5 w-3.5 text-indigo-200 hover:text-white" />
          }
        </button>
      </div>

      <p className="relative text-xs text-indigo-200 leading-relaxed">
        Sin app ni registro — tus clientes consultan su saldo con su código.
      </p>
    </div>
  );
}

function LinkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}
