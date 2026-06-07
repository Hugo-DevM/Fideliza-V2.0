'use client';

import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import type { PortalVoucher } from '@/modules/portal/portal.service';

interface Props {
  voucher: PortalVoucher;
  primaryColor: string;
}

// Always display as XXXX-XXX-XXX regardless of how it's stored
function formatDisplayCode(code: string): string {
  const raw = code.replace(/-/g, '');
  if (raw.length <= 4) return raw;
  if (raw.length <= 7) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return `${raw.slice(0, 4)}-${raw.slice(4, 7)}-${raw.slice(7)}`;
}

type View = 'code' | 'qr' | 'barcode';

export default function VoucherCard({ voucher: v, primaryColor }: Props) {
  const [view, setView] = useState<View>('code');
  const qrCanvasRef     = useRef<HTMLCanvasElement>(null);
  const barcodeSvgRef   = useRef<SVGSVGElement>(null);

  const expiresAt = v.expires_at ? new Date(v.expires_at) : null;
  const daysLeft  = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
    : null;

  useEffect(() => {
    if (view === 'qr' && qrCanvasRef.current) {
      QRCode.toCanvas(qrCanvasRef.current, v.redemption_code, {
        width: 200,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      });
    }
  }, [view, v.redemption_code]);

  useEffect(() => {
    if (view === 'barcode' && barcodeSvgRef.current) {
      JsBarcode(barcodeSvgRef.current, v.redemption_code, {
        format: 'CODE128',
        width: 2.2,
        height: 64,
        displayValue: true,
        font: 'monospace',
        fontSize: 13,
        margin: 12,
        background: '#ffffff',
        lineColor: '#1e1b4b',
      });
    }
  }, [view, v.redemption_code]);

  return (
    <div
      className="rounded-2xl border-2 p-4 shadow-sm"
      style={{ borderColor: primaryColor, backgroundColor: `${primaryColor}08` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: primaryColor }}
          >
            Voucher · Listo para usar
          </p>
          <p className="mt-0.5 font-bold text-gray-900 dark:text-white">{v.reward_name}</p>
          {daysLeft !== null && (
            <p
              className={`mt-0.5 text-xs ${
                daysLeft <= 3 ? 'text-red-500 font-medium' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              {daysLeft > 0
                ? `Vence en ${daysLeft} día${daysLeft !== 1 ? 's' : ''}`
                : 'Vence hoy'}
            </p>
          )}
        </div>
      </div>

      {/* Code display */}
      <div
        className="mt-3 rounded-xl bg-white dark:bg-[#0f1222] border border-dashed px-4 py-2.5 text-center"
        style={{ borderColor: primaryColor }}
      >
        <p className="font-mono text-lg font-bold tracking-normal text-gray-900 dark:text-white">
          {formatDisplayCode(v.redemption_code)}
        </p>
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">Muéstralo al personal</p>
      </div>

      {/* View toggle buttons */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => setView(view === 'qr' ? 'code' : 'qr')}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all"
          style={
            view === 'qr'
              ? { backgroundColor: primaryColor, color: '#fff' }
              : {
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}40`,
                }
          }
        >
          <QrIcon className="h-3.5 w-3.5" />
          {view === 'qr' ? 'Ocultar QR' : 'Ver QR'}
        </button>
        <button
          onClick={() => setView(view === 'barcode' ? 'code' : 'barcode')}
          className="flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all"
          style={
            view === 'barcode'
              ? { backgroundColor: primaryColor, color: '#fff' }
              : {
                  backgroundColor: `${primaryColor}15`,
                  color: primaryColor,
                  border: `1px solid ${primaryColor}40`,
                }
          }
        >
          <BarcodeIcon className="h-3.5 w-3.5" />
          {view === 'barcode' ? 'Ocultar código' : 'Código de barras'}
        </button>
      </div>

      {/* QR code */}
      {view === 'qr' && (
        <div className="mt-3 flex flex-col items-center rounded-xl bg-white p-4 shadow-inner">
          <canvas ref={qrCanvasRef} className="rounded-lg" />
          <p className="mt-2 text-[10px] text-gray-400 font-mono tracking-wider">
            {formatDisplayCode(v.redemption_code)}
          </p>
        </div>
      )}

      {/* Barcode */}
      {view === 'barcode' && (
        <div className="mt-3 flex flex-col items-center rounded-xl bg-white p-3 shadow-inner overflow-x-auto">
          <svg ref={barcodeSvgRef} className="max-w-full" />
        </div>
      )}
    </div>
  );
}

function QrIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 3.75 9.375v-4.5ZM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 0 1-1.125-1.125v-4.5ZM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0 1 13.5 9.375v-4.5Z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 6.75h.75v.75h-.75v-.75ZM6.75 16.5h.75v.75h-.75v-.75ZM16.5 6.75h.75v.75h-.75v-.75ZM13.5 13.5h.75v.75h-.75v-.75ZM13.5 18.75h.75v.75h-.75v-.75ZM18.75 13.5h.75v.75h-.75v-.75ZM18.75 18.75h.75v.75h-.75v-.75ZM16.5 16.5h.75v.75h-.75v-.75Z" />
    </svg>
  );
}

function BarcodeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v16.5M7.5 3.75v16.5M12 3.75v16.5M15.75 3.75v16.5M19.5 3.75v16.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 20.25h19.5M2.25 3.75h19.5" />
    </svg>
  );
}
