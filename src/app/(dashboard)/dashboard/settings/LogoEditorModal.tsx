'use client';

import { useRef, useState } from 'react';
import { useModalTransition } from '@/hooks/useModalTransition';

const EXPORT_SIZE = 512;   // px — square PNG output
const MIN_SCALE   = 0.4;   // zoom out → transparent margin around logo
const MAX_SCALE   = 4;

export type LogoEditorStrings = {
  editorTitle: string;
  editorHint: string;
  zoom: string;
  cancel: string;
  save: string;
  saving: string;
};

interface Props {
  open: boolean;
  imageSrc: string | null;
  saving: boolean;
  t: LogoEditorStrings;
  onCancel: () => void;
  onSave: (blob: Blob) => void;
}

export default function LogoEditorModal({ open, imageSrc, saving, t, onCancel, onSave }: Props) {
  const { mounted, visible } = useModalTransition(open);

  const viewportRef = useRef<HTMLDivElement>(null);
  const imgRef      = useRef<HTMLImageElement>(null);
  const dragRef     = useRef<{ pointerId: number; startX: number; startY: number; baseX: number; baseY: number } | null>(null);

  const [scale,  setScale]  = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imgDims, setImgDims] = useState<{ w: number; h: number } | null>(null);
  const [vpSize, setVpSize] = useState(340);

  // Reset editing state each time the modal opens with a new image
  const [prevSrc, setPrevSrc] = useState(imageSrc);
  if (prevSrc !== imageSrc) {
    setPrevSrc(imageSrc);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setImgDims(null);
  }

  // "Contain" fit of the image inside the viewport at scale 1
  function baseFit(viewportSize: number) {
    if (!imgDims) return { w: viewportSize, h: viewportSize };
    const ratio = Math.min(viewportSize / imgDims.w, viewportSize / imgDims.h);
    return { w: imgDims.w * ratio, h: imgDims.h * ratio };
  }

  function clampOffset(next: { x: number; y: number }, s: number) {
    const vp = viewportRef.current;
    if (!vp) return next;
    const size = vp.clientWidth;
    const fit  = baseFit(size);
    // Keep at least 48px of the image inside the viewport
    const maxX = (fit.w * s + size) / 2 - 48;
    const maxY = (fit.h * s + size) / 2 - 48;
    return {
      x: Math.min(maxX, Math.max(-maxX, next.x)),
      y: Math.min(maxY, Math.max(-maxY, next.y)),
    };
  }

  function handlePointerDown(e: React.PointerEvent) {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
  }

  function handlePointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    setOffset(
      clampOffset(
        { x: drag.baseX + (e.clientX - drag.startX), y: drag.baseY + (e.clientY - drag.startY) },
        scale,
      ),
    );
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
  }

  function applyScale(next: number) {
    const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
    setScale(s);
    setOffset((o) => clampOffset(o, s));
  }

  function handleWheel(e: React.WheelEvent) {
    applyScale(scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  }

  function handleSave() {
    const vp  = viewportRef.current;
    const img = imgRef.current;
    if (!vp || !img || !imgDims) return;

    const size  = vp.clientWidth;
    const ratio = EXPORT_SIZE / size;
    const fit   = baseFit(size);
    const drawW = fit.w * scale * ratio;
    const drawH = fit.h * scale * ratio;
    const cx    = EXPORT_SIZE / 2 + offset.x * ratio;
    const cy    = EXPORT_SIZE / 2 + offset.y * ratio;

    const canvas = document.createElement('canvas');
    canvas.width  = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, cx - drawW / 2, cy - drawH / 2, drawW, drawH);

    canvas.toBlob((blob) => {
      if (blob) onSave(blob);
    }, 'image/png');
  }

  if (!mounted || !imageSrc) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        transition: 'background-color 220ms ease',
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white dark:bg-[#161b2e] shadow-2xl flex flex-col max-h-[90dvh]"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.97)',
          transition: 'opacity 220ms ease, transform 220ms ease',
        }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">{t.editorTitle}</h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.editorHint}</p>
        </div>

        {/* Crop viewport */}
        <div className="px-6 flex justify-center">
          <div
            ref={viewportRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            className="relative w-full max-w-[340px] aspect-square overflow-hidden rounded-2xl
                       border border-gray-200 dark:border-[#1e2438]
                       bg-[repeating-conic-gradient(#f3f4f6_0%_25%,#ffffff_0%_50%)] dark:bg-[repeating-conic-gradient(#1a1f35_0%_25%,#12162a_0%_50%)]
                       [background-size:20px_20px]
                       cursor-grab active:cursor-grabbing touch-none select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt=""
              draggable={false}
              onLoad={(e) => {
                const el = e.currentTarget;
                setImgDims({ w: el.naturalWidth, h: el.naturalHeight });
                if (viewportRef.current) setVpSize(viewportRef.current.clientWidth);
              }}
              className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
              style={
                imgDims
                  ? {
                      width:  baseFit(vpSize).w,
                      height: baseFit(vpSize).h,
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${scale})`,
                    }
                  : { opacity: 0 }
              }
            />
            {/* Center guides */}
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute left-1/2 top-0 h-full w-px bg-indigo-400/20" />
              <div className="absolute top-1/2 left-0 w-full h-px bg-indigo-400/20" />
            </div>
          </div>
        </div>

        {/* Zoom slider */}
        <div className="px-6 pt-4">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-10">{t.zoom}</span>
            <input
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.01}
              value={scale}
              onChange={(e) => applyScale(Number(e.target.value))}
              className="flex-1 accent-indigo-600"
              aria-label={t.zoom}
            />
            <span className="text-xs tabular-nums text-gray-400 dark:text-gray-500 w-10 text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-6 py-5 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={onCancel}
            className="rounded-xl border border-gray-200 dark:border-[#1e2438] bg-white dark:bg-[#1a1f35] px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-50 transition"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            disabled={saving || !imgDims}
            onClick={handleSave}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? t.saving : t.save}
          </button>
        </div>
      </div>
    </div>
  );
}
