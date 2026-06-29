"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction } from "./actions";
import { getLocalLimits } from "@/lib/constants/phone-limits";
import { useAutoError } from "@/hooks/useAutoError";
import { useModalTransition } from "@/hooks/useModalTransition";

const NAME_ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙäëïöüÄËÏÖÜñÑçÇ ]*$/;
const NAME_MAX = 50;

function capitalizeWords(value: string) {
  return value.replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

interface Props {
  phonePrefix: string | null;
  plan: string;
}

export default function NewCustomerModal({ phonePrefix, plan }: Props) {
  const [open, setOpen] = useState(false);
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(open);
  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
  const [isPending, startTransition] = useTransition();
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [notesLen, setNotesLen] = useState(0);
  const [whatsappOptIn, setWhatsappOptIn] = useState(false);
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay,   setBirthDay]   = useState("");
  const [birthYear,  setBirthYear]  = useState("");
  const NOTES_MAX = 300;
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const {
    min: localMin,
    max: localMax,
    hint: localHint,
  } = getLocalLimits(phonePrefix);
  const fullPhone = phonePrefix ? phonePrefix + phone : phone;

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (!NAME_ALLOWED.test(raw)) return;
    if (raw.length > NAME_MAX) return;
    setName(capitalizeWords(raw));
  }

  function handlePhoneChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length > localMax) return;
    setPhone(raw);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (phone.length < localMin) {
      setError(`El teléfono debe tener ${localHint}.`);
      return;
    }
    const data = new FormData(e.currentTarget);
    // Replace the visible phone with the full value (prefix + local)
    data.set("phone", fullPhone);

    data.set("whatsapp_opt_in", whatsappOptIn ? "true" : "false");

    startTransition(async () => {
      const result = await createCustomerAction(data);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setName("");
        setPhone("");
        setNotesLen(0);
        setWhatsappOptIn(false);
        setBirthMonth("");
        setBirthDay("");
        setBirthYear("");
        setOpen(false);
        router.refresh();
      }
    });
  }

  function handleClose() {
    setName("");
    setPhone("");
    setNotesLen(0);
    setWhatsappOptIn(false);
    setBirthMonth("");
    setBirthDay("");
    setBirthYear("");
    setError("");
    formRef.current?.reset();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 shrink-0"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo cliente
      </button>

      {modalMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] shadow-2xl flex flex-col max-h-[90dvh]"
            style={{ opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >
            {/* Header — fijo */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Agregar cliente
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none transition"
              >
                ×
              </button>
            </div>

            <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#2a3147]">
              {mounted && (
                <div style={wrapperStyle}>
                  <div style={{ overflow: 'hidden' }}>
                    <p style={errorStyle} className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                      {displayText}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre completo *</label>
                  <span className={`text-xs ${name.length >= Math.floor(NAME_MAX * 0.85) ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {name.length} / {NAME_MAX}
                  </span>
                </div>
                <input
                  name="name"
                  type="text"
                  placeholder="Alice Méndez"
                  required
                  value={name}
                  onChange={handleNameChange}
                  className={inputCls}
                />
              </div>

              {!phonePrefix && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-3 py-2.5">
                  <svg className="h-4 w-4 shrink-0 mt-0.5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                  <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    No tienes un prefijo telefónico configurado. Los teléfonos se guardarán sin prefijo de país.{' '}
                    <a href="/dashboard/settings" className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-300 transition">
                      Configurar en Ajustes →
                    </a>
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Teléfono *
                </label>
                <div className="flex">
                  {phonePrefix && (
                    <span className="inline-flex items-center rounded-l-xl border border-r-0 border-gray-200 dark:border-[#2a3147] bg-gray-100 dark:bg-[#1a1f35] px-3 text-sm font-medium text-gray-600 dark:text-gray-400 select-none shrink-0">
                      {phonePrefix}
                    </span>
                  )}
                  {/* Hidden input carries the full phone value to the server */}
                  <input type="hidden" name="phone" value={fullPhone} />
                  <input
                    type="tel"
                    placeholder={phonePrefix ? "8134529076" : "Configura un prefijo primero"}
                    required
                    disabled={!phonePrefix}
                    value={phone}
                    onChange={handlePhoneChange}
                    maxLength={localMax}
                    className={[
                      inputCls,
                      phonePrefix ? "rounded-l-none" : "",
                      !phonePrefix ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-[#1a1f35]" : "",
                      phone.length > 0 && phone.length < localMin
                        ? "border-amber-400 focus:border-amber-400 dark:focus:border-amber-500 focus:ring-amber-100 dark:focus:ring-amber-500/20"
                        : "",
                    ].join(" ")}
                  />
                </div>
                {/* Hints */}
                {phone.length === 0 && phonePrefix && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    Se esperan <span className="font-medium">{localHint}</span>
                  </p>
                )}
                {phone.length > 0 && phone.length < localMin && (
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    {localMin - phone.length} dígito
                    {localMin - phone.length !== 1 ? "s" : ""} más · se esperan{" "}
                    {localHint}
                  </p>
                )}
                {phone.length >= localMin && (
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    {phonePrefix ? (
                      <>
                        Se guardará como{" "}
                        <span className="font-mono text-gray-600 dark:text-gray-300">
                          {fullPhone}
                        </span>
                      </>
                    ) : (
                      <span className="font-mono text-gray-600 dark:text-gray-300">
                        {phone}
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Notas</label>
                  <span className={`text-xs ${notesLen >= Math.floor(NOTES_MAX * 0.85) ? 'text-amber-500' : 'text-gray-400 dark:text-gray-500'}`}>
                    {notesLen} / {NOTES_MAX}
                  </span>
                </div>
                <textarea
                  name="notes"
                  rows={5}
                  maxLength={NOTES_MAX}
                  placeholder="Notas internas (no visibles al cliente)"
                  onChange={(e) => setNotesLen(e.target.value.length)}
                  className={`${inputCls} resize-none`}
                />
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Fecha de cumpleaños <span className="text-gray-400 dark:text-gray-500 font-normal">(opcional)</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <CustomSelect
                    name="birth_day"
                    value={birthDay}
                    onChange={setBirthDay}
                    placeholder="Día"
                    options={Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))}
                  />
                  <CustomSelect
                    name="birth_month"
                    value={birthMonth}
                    onChange={(v) => { setBirthMonth(v); if (!v) setBirthDay(""); }}
                    placeholder="Mes"
                    options={['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'].map((m, i) => ({ value: String(i + 1), label: m }))}
                  />
                  <CustomSelect
                    name="birth_year"
                    value={birthYear}
                    onChange={setBirthYear}
                    placeholder="Año"
                    options={Array.from({ length: 100 }, (_, i) => {
                      const y = new Date().getFullYear() - i;
                      return { value: String(y), label: String(y) };
                    })}
                  />
                </div>
              </div>

              {/* WhatsApp opt-in */}
              <button
                type="button"
                onClick={() => setWhatsappOptIn((v) => !v)}
                className={[
                  "w-full flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition",
                  whatsappOptIn
                    ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/30"
                    : "border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] hover:border-gray-300 dark:hover:border-[#3a4160]",
                ].join(" ")}
              >
                <span className={[
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition",
                  whatsappOptIn
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300 dark:border-gray-600",
                ].join(" ")}>
                  {whatsappOptIn && (
                    <svg className="h-3 w-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notificaciones por WhatsApp
                  </span>
                  <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    El cliente acepta recibir avisos de puntos, recompensas y promociones
                  </span>
                </span>
                <WhatsAppIcon className="h-5 w-5 shrink-0 text-green-500" />
              </button>
              {plan === 'free' && (
                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2 px-1">
                  El consentimiento se guarda ahora.{' '}
                  <a href="/dashboard/settings" className="text-indigo-500 hover:underline">
                    Activa las notificaciones con Plan Starter →
                  </a>
                </p>
              )}

            </div>

            {/* Footer — fijo */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#1e2438] shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl border border-gray-200 dark:border-[#2a3147] px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isPending ? "Creando…" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputCls =
  "w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#0d0f17] px-3 py-2.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20";

function CustomSelect({ name, value, onChange, placeholder, options }: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value} />

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition outline-none ${
          open
            ? 'border-indigo-400 dark:border-indigo-500 ring-2 ring-indigo-100 dark:ring-indigo-500/20'
            : 'border-gray-200 dark:border-[#2a3147] hover:border-gray-300 dark:hover:border-[#3a4157]'
        } bg-white dark:bg-[#0d0f17]`}
      >
        <span className={selected ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 dark:text-gray-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown list */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#161b2e] shadow-lg overflow-hidden">
          <ul className="max-h-48 overflow-y-auto py-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-[#2a3147]">
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-sm transition ${
                    o.value === value
                      ? 'bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1e2438]'
                  }`}
                >
                  {o.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 4.5v15m7.5-7.5h-15"
      />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}
