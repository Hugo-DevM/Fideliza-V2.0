'use client';

import { useState, useTransition, useRef, useEffect, useCallback } from 'react';
import { useModalTransition } from '@/hooks/useModalTransition';
import jsQR from 'jsqr';
import { verifyVoucherAction } from './programs/[id]/actions';
import { useDashboardI18n } from '@/lib/i18n/dashboard-context';
import { formatTimeOnly } from '@/lib/utils/date';

interface RedemptionInfo {
  redemptionCode: string;
  customerName: string | null;
  rewardName: string | null;
  rewardDesc: string | null;
  usedAt: string;
}

// Format raw chars as XXXX-XXX-XXX (always uppercase, auto-hyphens at pos 4 and 7)
function formatCode(raw: string): string {
  const chars = raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 10);
  if (chars.length <= 4) return chars;
  if (chars.length <= 7) return `${chars.slice(0, 4)}-${chars.slice(4)}`;
  return `${chars.slice(0, 4)}-${chars.slice(4, 7)}-${chars.slice(7)}`;
}

export default function VerifyVoucherForm() {
  const { timezone, locale } = useDashboardI18n();
  const [code, setCode]              = useState('');
  const [error, setError]            = useState('');
  const [info, setInfo]              = useState<RedemptionInfo | null>(null);
  // Keep last info content visible during modal exit animation
  const displayInfoRef               = useRef<RedemptionInfo | null>(null);
  if (info) displayInfoRef.current   = info;
  const [isPending, startTransition] = useTransition();
  const [scanning, setScanning]      = useState(false);
  const { mounted: scanMounted, visible: scanVisible } = useModalTransition(scanning);
  const { mounted: infoMounted, visible: infoVisible } = useModalTransition(!!info);
  const [errorVisible,   setErrorVisible]   = useState(false);
  const [errorMounted,   setErrorMounted]   = useState(false);
  const [errorDisplayText, setErrorDisplayText] = useState('');
  const errorTimerRef                = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountTimerRef              = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [scanError, setScanError]    = useState('');
  const inputRef    = useRef<HTMLInputElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Callback ref: fires the instant the <video> node enters the DOM
  const videoCallbackRef = useCallback((node: HTMLVideoElement | null) => {
    if (!node || !streamRef.current) return;
    node.srcObject = streamRef.current;

    function tick() {
      if (!node || node.readyState < 2 || !node.videoWidth) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
      canvas.width  = node.videoWidth;
      canvas.height = node.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
      ctx.drawImage(node, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      if (result?.data) {
        setCode(formatCode(result.data));
        setScanning(false);
        stopCamera();
        setTimeout(() => inputRef.current?.focus(), 50);
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    node.play().then(() => {
      rafRef.current = requestAnimationFrame(tick);
    }).catch(() => {
      rafRef.current = requestAnimationFrame(tick);
    });
  }, [stopCamera]);

  async function openScanner() {
    setScanError('');
    if (!window.isSecureContext) {
      setScanError('INSECURE');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanError('La cámara requiere conexión segura (HTTPS).');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      streamRef.current = stream;
      setScanning(true);
    } catch (err) {
      const name = (err as { name?: string }).name;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setScanError('PERMISSION_DENIED');
      } else if (name === 'NotFoundError') {
        setScanError('No se encontró ninguna cámara en este dispositivo.');
      } else if (name === 'NotReadableError' || name === 'AbortError') {
        setScanError('La cámara está siendo usada por otra aplicación.');
      } else {
        setScanError('No se pudo acceder a la cámara. Verifica los permisos del sitio.');
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  // Animate in/out and auto-clear errors after 3 seconds (except permission errors)
  useEffect(() => {
    const active = error || scanError;
    if (!active) {
      setErrorVisible(false);
      if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = setTimeout(() => {
        setErrorMounted(false);
        setErrorDisplayText('');
      }, 400);
      return;
    }
    if (unmountTimerRef.current) clearTimeout(unmountTimerRef.current);
    setErrorDisplayText(active);
    setErrorMounted(true);
    requestAnimationFrame(() => setErrorVisible(true));
    // Don't auto-dismiss permission errors — user needs to read the instructions
    if (active === 'PERMISSION_DENIED') return;
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setErrorVisible(false);
      setTimeout(() => { setError(''); setScanError(''); }, 350);
    }, 4000);
    return () => { if (errorTimerRef.current) clearTimeout(errorTimerRef.current); };
  }, [error, scanError]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCode(formatCode(e.target.value));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setError('');
    setInfo(null);

    startTransition(async () => {
      const result = await verifyVoucherAction(code);
      if ('error' in result && result.error) {
        setError(result.error);
      } else if ('success' in result) {
        setInfo({
          redemptionCode: result.redemptionCode ?? code.toUpperCase(),
          customerName:   result.customerName ?? null,
          rewardName:     result.rewardName ?? null,
          rewardDesc:     result.rewardDesc ?? null,
          usedAt:         result.usedAt ?? new Date().toISOString(),
        });
        setCode('');
      }
    });
  }

  function handleClose() {
    setInfo(null);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  const displayInfo = displayInfoRef.current;
  const usedTime = displayInfo ? formatTimeOnly(displayInfo.usedAt, timezone, locale) : '';

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Canjear recompensa</h2>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <TicketIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            inputMode="text"
            value={code}
            onChange={handleChange}
            placeholder="P. EJ. BREW-XK3-72F"
            className="w-full rounded-xl border border-gray-200 dark:border-[#2a3147] bg-gray-50 dark:bg-[#0d0f17] pl-9 pr-3 py-2.5 font-mono text-sm uppercase text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600 outline-none transition focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-500/20"
            maxLength={12}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* QR scanner button */}
        <button
          type="button"
          onClick={openScanner}
          title="Escanear QR"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#1e2438] hover:bg-gray-50 dark:hover:bg-[#252f4a] px-3 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition"
        >
          <CameraIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Escanear</span>
        </button>

        {/* Verify button */}
        <button
          type="submit"
          disabled={isPending || !code.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-[#2a3147] bg-white dark:bg-[#1e2438] hover:bg-gray-50 dark:hover:bg-[#252f4a] disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 transition"
        >
          <ScanIcon className="h-4 w-4" />
          {isPending ? '…' : 'Verificar'}
        </button>
      </form>

      {errorMounted && (
        <div className="mt-2.5" style={{
          display: 'grid',
          gridTemplateRows: errorVisible ? '1fr' : '0fr',
          transition: 'grid-template-rows 350ms ease',
        }}>
          <div style={{ overflow: 'hidden' }}>
            {errorDisplayText === 'INSECURE' ? (
              <div
                className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/40 px-3 py-3 space-y-1"
                style={{
                  opacity: errorVisible ? 1 : 0,
                  transform: errorVisible ? 'translateY(0)' : 'translateY(-4px)',
                  transition: 'opacity 280ms ease, transform 280ms ease',
                }}
              >
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">Conexión no segura (HTTP)</p>
                <p className="text-xs text-red-700 dark:text-red-400 leading-relaxed">
                  Los navegadores bloquean la cámara en sitios HTTP. Accede al dashboard usando <strong>HTTPS</strong> para poder escanear.
                </p>
                <button type="button" onClick={() => setScanError('')} className="text-xs font-medium text-red-600 dark:text-red-400 underline hover:no-underline">Entendido</button>
              </div>
            ) : errorDisplayText === 'PERMISSION_DENIED' ? (
              <div
                className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 px-3 py-3 space-y-2"
                style={{
                  opacity: errorVisible ? 1 : 0,
                  transform: errorVisible ? 'translateY(0)' : 'translateY(-4px)',
                  transition: 'opacity 280ms ease, transform 280ms ease',
                }}
              >
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Cámara bloqueada</p>
                <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed space-y-1">
                  <p><strong>Chrome / Edge:</strong> Haz clic en el ícono 🔒 en la barra de direcciones → Cámara → Permitir → Recarga.</p>
                  <p><strong>Brave:</strong> Haz clic en el ícono del León 🦁 en la barra de direcciones → baja los escudos para este sitio → Recarga.</p>
                  <p><strong>Firefox:</strong> Haz clic en el ícono de cámara 🎥 a la izquierda de la URL → Eliminar bloqueo → Recarga.</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setScanError(''); }}
                  className="text-xs font-medium text-amber-600 dark:text-amber-400 underline hover:no-underline"
                >
                  Entendido
                </button>
              </div>
            ) : (
              <p
                className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/30 px-3 py-2 text-sm text-red-600 dark:text-red-400"
                style={{
                  opacity: errorVisible ? 1 : 0,
                  transform: errorVisible ? 'translateY(0)' : 'translateY(-4px)',
                  transition: 'opacity 280ms ease, transform 280ms ease',
                }}
              >
                {errorDisplayText}
              </p>
            )}
          </div>
        </div>
      )}

      {/* QR Scanner modal */}
      {scanMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: scanVisible ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-sm overflow-hidden rounded-3xl bg-white dark:bg-[#161b2e] shadow-2xl"
            style={{ opacity: scanVisible ? 1 : 0, transform: scanVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
              <div className="flex items-center gap-2">
                <CameraIcon className="h-4 w-4 text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Escanear código</h3>
              </div>
              <button
                onClick={() => { setScanning(false); stopCamera(); }}
                className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>

            {/* Camera viewfinder */}
            <div className="relative bg-black aspect-square overflow-hidden">
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
              <video
                ref={videoCallbackRef}
                muted
                autoPlay
                playsInline
                className="h-full w-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
              {/* Targeting overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative h-52 w-52">
                  {/* Corner brackets */}
                  <span className="absolute top-0 left-0 h-8 w-8 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <span className="absolute top-0 right-0 h-8 w-8 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <span className="absolute bottom-0 left-0 h-8 w-8 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <span className="absolute bottom-0 right-0 h-8 w-8 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                  {/* Scanning line */}
                  <span className="absolute left-2 right-2 h-0.5 bg-indigo-400/80 animate-scan-line" />
                </div>
              </div>
            </div>

            <p className="px-5 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
              Apunta la cámara al código QR o de barras del voucher
            </p>
          </div>
        </div>
      )}

      {/* Success modal */}
      {infoMounted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: infoVisible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)', transition: 'background-color 220ms ease' }}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#161b2e] shadow-2xl overflow-hidden"
            style={{ opacity: infoVisible ? 1 : 0, transform: infoVisible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)', transition: 'opacity 220ms ease, transform 220ms ease' }}
          >

            {/* Green header */}
            <div className="bg-emerald-500 px-6 pt-7 pb-5 text-center text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 mx-auto mb-3">
                <CheckIcon className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-lg font-bold">¡Recompensa entregada!</h2>
              <p className="mt-0.5 text-sm opacity-85">Voucher verificado a las {usedTime}</p>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400">
                  <UserIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Cliente</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {displayInfo?.customerName ?? 'Desconocido'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  <GiftIcon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Recompensa entregada</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {displayInfo?.rewardName ?? 'Premio'}
                  </p>
                  {displayInfo?.rewardDesc && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{displayInfo.rewardDesc}</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 dark:bg-[#0d0f17] border border-gray-100 dark:border-[#2a3147] px-4 py-3 text-center">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1">Código</p>
                <p className="font-mono text-sm font-bold tracking-widest text-gray-700 dark:text-gray-200">
                  {displayInfo?.redemptionCode}
                </p>
              </div>

              <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
                Entrega la recompensa al cliente y cierra esta ventana.
              </p>
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleClose}
                className="w-full rounded-2xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75a3.375 3.375 0 0 1-3.375 3.375h-1.5a3.375 3.375 0 0 1-3.375-3.375V6m-1.125 0h10.875m-10.875 0a1.125 1.125 0 0 0-1.125 1.125v3.375c0 .621.504 1.125 1.125 1.125H6m10.875-5.625H18a1.125 1.125 0 0 1 1.125 1.125v3.375c0 .621-.504 1.125-1.125 1.125h-1.125M6 10.5h12M6 10.5v8.25A1.5 1.5 0 0 0 7.5 20.25h9a1.5 1.5 0 0 0 1.5-1.5V10.5" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}

function ScanIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 18.75h.75v.75h-.75v-.75ZM18.75 13.5h.75v.75h-.75v-.75ZM18.75 18.75h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
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

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
    </svg>
  );
}

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  );
}
