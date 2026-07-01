'use client';

import { useRef, useState, useTransition } from 'react';
import { updateTicketAction } from './actions';

export default function TicketReplyForm({
  ticketId,
  currentStatus,
  currentReply,
}: {
  ticketId:      string;
  currentStatus: string;
  currentReply:  string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg]  = useState<{ ok: boolean; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setMsg(null);
    startTransition(async () => {
      const res = await updateTicketAction(fd);
      if (res.error) setMsg({ ok: false, text: res.error });
      else            setMsg({ ok: true,  text: 'Ticket actualizado.' });
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3 mt-3">
      <input type="hidden" name="ticket_id" value={ticketId} />

      <select
        name="status"
        defaultValue={currentStatus}
        className="rounded-lg border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-1.5 text-sm text-gray-900 dark:text-white"
      >
        <option value="open">Abierto</option>
        <option value="in_progress">En proceso</option>
        <option value="resolved">Resuelto</option>
      </select>

      <textarea
        name="admin_reply"
        defaultValue={currentReply ?? ''}
        rows={3}
        placeholder="Respuesta para el cliente (opcional)…"
        className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 resize-y"
      />

      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{msg.text}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}
