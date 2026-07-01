'use client';

import { useRef, useState, useTransition } from 'react';
import { submitSupportTicketAction } from './actions';

export default function TicketForm() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setMsg(null);
    startTransition(async () => {
      const res = await submitSupportTicketAction(fd);
      if (res.error) {
        setMsg({ ok: false, text: res.error });
      } else {
        setMsg({ ok: true, text: 'Ticket enviado. Te responderemos pronto.' });
        formRef.current?.reset();
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Asunto
        </label>
        <input
          type="text"
          name="subject"
          required
          minLength={5}
          maxLength={200}
          placeholder="Describe brevemente tu problema…"
          className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Mensaje
        </label>
        <textarea
          name="message"
          required
          minLength={20}
          maxLength={5000}
          rows={5}
          placeholder="Explica con detalle lo que necesitas o el problema que encontraste…"
          className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-y"
        />
      </div>

      {msg && (
        <p className={`text-sm ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {msg.text}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? 'Enviando…' : 'Enviar ticket'}
      </button>
    </form>
  );
}
