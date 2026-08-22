'use client';

import { useRef, useState, useTransition } from 'react';
import { sendHelpEmailAction } from './actions';

/**
 * Textos precargados para no escribir lo mismo cada vez. Son un punto de
 * partida editable, no plantillas fijas: el asunto y el cuerpo quedan en el
 * formulario y se pueden cambiar antes de enviar.
 */
const QUICK_TEMPLATES: Array<{
  id:      string;
  label:   string;
  subject: string;
  body:    string;
}> = [
  {
    id:      'sin-programa',
    label:   'Aún sin programa',
    subject: '¿Te ayudo a arrancar tu programa?',
    body:
      'Vi que ya creaste tu cuenta en Fideliza pero todavía no configuras tu primer programa de lealtad. Es el paso que hace que todo lo demás funcione, y toma unos 10 minutos.\n\n' +
      'Si quieres lo configuramos juntos: dime qué tipo te interesa (puntos, sellos o visitas) y qué premio quieres dar, y te dejo listo el programa.\n\n' +
      'Responde este correo y lo vemos.',
  },
  {
    id:      'sin-clientes',
    label:   'Sin clientes',
    subject: 'Cómo registrar a tus primeros clientes',
    body:
      'Ya tienes tu programa listo, pero aún no registras clientes. Lo más rápido es hacerlo en el mostrador: desde Registro rápido capturas nombre y teléfono en unos segundos y el cliente recibe su código de acceso.\n\n' +
      'Si te sirve, te comparto una guía corta o lo vemos en una llamada de 15 minutos.\n\n' +
      'Responde este correo y te ayudo.',
  },
  {
    id:      'whatsapp',
    label:   'WhatsApp',
    subject: '¿Activamos los mensajes de WhatsApp?',
    body:
      'Los mensajes de WhatsApp son lo que más regresa clientes: avisos de saldo, vencimiento de premios y reactivación de quienes llevan tiempo sin visitarte.\n\n' +
      'Puedo ayudarte a activarlos y revisar contigo cuáles conviene encender según tu plan.\n\n' +
      'Responde este correo y lo configuramos.',
  },
];

export default function TenantHelpForm({
  tenantId,
  tenantName,
  tenantEmail,
}: {
  tenantId:    string;
  tenantName:  string;
  tenantEmail: string;
}) {
  const [open, setOpen]  = useState(false);
  const [msg, setMsg]    = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  const formRef    = useRef<HTMLFormElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);
  const bodyRef    = useRef<HTMLTextAreaElement>(null);

  function applyTemplate(id: string) {
    const tpl = QUICK_TEMPLATES.find((t) => t.id === id);
    if (!tpl || !subjectRef.current || !bodyRef.current) return;
    subjectRef.current.value = tpl.subject;
    bodyRef.current.value    = `Hola, ${tenantName}:\n\n${tpl.body}`;
    setMsg(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setMsg(null);
    startTransition(async () => {
      const res = await sendHelpEmailAction(fd);
      if (res.error) {
        setMsg({ ok: false, text: res.error });
      } else {
        setMsg({ ok: true, text: `Correo enviado a ${res.sentTo}.` });
        formRef.current?.reset();
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-500/20"
      >
        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
        Enviar correo
      </button>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mt-3 space-y-3 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50/60 dark:bg-[#0b0e1a] p-3">
      <input type="hidden" name="tenant_id" value={tenantId} />

      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Para: <span className="font-medium text-gray-700 dark:text-gray-300">{tenantEmail}</span>
        </p>
        <button
          type="button"
          onClick={() => { setOpen(false); setMsg(null); }}
          className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          Cancelar
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {QUICK_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t.id)}
            className="rounded-full border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-2.5 py-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:border-indigo-300 hover:text-indigo-600 dark:hover:text-indigo-300"
          >
            {t.label}
          </button>
        ))}
      </div>

      <input
        ref={subjectRef}
        name="subject"
        maxLength={150}
        required
        placeholder="Asunto"
        className="w-full rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
      />

      <textarea
        ref={bodyRef}
        name="message"
        rows={7}
        maxLength={4000}
        required
        placeholder="Mensaje…"
        className="w-full resize-y rounded-lg border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400"
      />

      {msg && (
        <p className={`text-xs ${msg.ok ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{msg.text}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
      >
        {isPending ? 'Enviando…' : 'Enviar correo'}
      </button>
    </form>
  );
}
