'use client';

import { useRef, useState, useTransition } from 'react';
import { submitSupportTicketAction } from './actions';

const SUBJECT_MIN = 5;
const SUBJECT_MAX = 200;
const MESSAGE_MIN = 20;
const MESSAGE_MAX = 5000;

export default function TicketForm() {
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg]       = useState<{ ok: boolean; text: string } | null>(null);
  const [subject, setSubject]   = useState('');
  const [message, setMessage]   = useState('');
  const [errors, setErrors]     = useState<{ subject?: string; message?: string }>({});
  const formRef = useRef<HTMLFormElement>(null);

  function validate() {
    const e: { subject?: string; message?: string } = {};
    if (subject.trim().length < SUBJECT_MIN)
      e.subject = `Mínimo ${SUBJECT_MIN} caracteres.`;
    else if (subject.trim().length > SUBJECT_MAX)
      e.subject = `Máximo ${SUBJECT_MAX} caracteres.`;
    if (message.trim().length < MESSAGE_MIN)
      e.message = `Mínimo ${MESSAGE_MIN} caracteres.`;
    else if (message.trim().length > MESSAGE_MAX)
      e.message = `Máximo ${MESSAGE_MAX} caracteres.`;
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setMsg(null);
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      const res = await submitSupportTicketAction(fd);
      if (res.error) {
        setMsg({ ok: false, text: res.error });
      } else {
        setMsg({ ok: true, text: 'Ticket enviado. Te responderemos pronto.' });
        setSubject('');
        setMessage('');
        formRef.current?.reset();
      }
    });
  }

  const subjectLeft = SUBJECT_MAX - subject.length;
  const messageLeft = MESSAGE_MAX - message.length;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">

      {/* Asunto */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Asunto
          </label>
          <span className={`text-xs ${subjectLeft < 20 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {subjectLeft}
          </span>
        </div>
        <input
          type="text"
          name="subject"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
          }}
          maxLength={SUBJECT_MAX}
          placeholder="Describe brevemente tu problema…"
          className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 bg-gray-50 dark:bg-[#161b2e] outline-none transition-colors focus:ring-2 focus:ring-indigo-500/40 ${
            errors.subject
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-[#2a3147] focus:border-indigo-400 dark:focus:border-indigo-500'
          }`}
        />
        {errors.subject && (
          <p className="text-xs text-red-500 dark:text-red-400">{errors.subject}</p>
        )}
      </div>

      {/* Mensaje */}
      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Mensaje
          </label>
          <span className={`text-xs ${messageLeft < 100 ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
            {messageLeft}
          </span>
        </div>
        <textarea
          name="message"
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (errors.message) setErrors((prev) => ({ ...prev, message: undefined }));
          }}
          maxLength={MESSAGE_MAX}
          placeholder="Explica con detalle lo que necesitas o el problema que encontraste…"
          className={`w-full rounded-xl border px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 bg-gray-50 dark:bg-[#161b2e] outline-none transition-colors focus:ring-2 focus:ring-indigo-500/40 resize-none overflow-y-auto ${
            errors.message
              ? 'border-red-400 dark:border-red-500'
              : 'border-gray-200 dark:border-[#2a3147] focus:border-indigo-400 dark:focus:border-indigo-500'
          }`}
          style={{ height: '140px' }}
        />
        {errors.message && (
          <p className="text-xs text-red-500 dark:text-red-400">{errors.message}</p>
        )}
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
