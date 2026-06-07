"use client";

import { useState, useTransition, useRef } from "react";
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
}

export default function NewCustomerModal({ phonePrefix }: Props) {
  const [open, setOpen] = useState(false);
  const { mounted: modalMounted, visible: modalVisible } = useModalTransition(open);
  const { error, setError, mounted, displayText, wrapperStyle, errorStyle } = useAutoError();
  const [isPending, startTransition] = useTransition();
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [notesLen, setNotesLen] = useState(0);
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

    startTransition(async () => {
      const result = await createCustomerAction(data);
      if ("error" in result && result.error) {
        setError(result.error);
      } else {
        formRef.current?.reset();
        setName("");
        setPhone("");
        setNotesLen(0);
        setOpen(false);
        router.refresh();
      }
    });
  }

  function handleClose() {
    setName("");
    setPhone("");
    setNotesLen(0);
    setError("");
    formRef.current?.reset();
    setOpen(false);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 shrink-0"
      >
        <PlusIcon className="h-4 w-4" />
        Nuevo cliente
      </button>

      {modalMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: modalVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] p-6 shadow-2xl"
            style={{ opacity: modalVisible ? 1 : 0, transform: modalVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >
            <div className="mb-5 flex items-center justify-between">
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

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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

              <div className="flex justify-end gap-3 pt-1">
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
