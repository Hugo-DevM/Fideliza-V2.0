import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/lib/i18n';

interface MultiDeviceProps {
  t: Dictionary['multiDevice'];
}

// ── Laptop mockup — shows the full dashboard ───────────────────────────────
function LaptopMockup() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 268 }}>
      {/* Lid / screen bezel */}
      <div
        className="rounded-t-xl bg-gray-800 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.32)]"
        style={{ padding: '6px 6px 0 6px' }}
      >
        {/* Webcam dot */}
        <div className="flex justify-center mb-[3px]">
          <div className="w-[5px] h-[5px] rounded-full bg-gray-600" />
        </div>

        {/* Screen glass */}
        <div className="rounded-t bg-white overflow-hidden" style={{ height: 158 }}>
          <div className="flex h-full">

            {/* Sidebar */}
            <div className="flex flex-col bg-white border-r border-gray-100 py-2 px-1.5" style={{ width: 48 }}>
              <span className="text-[8px] font-extrabold text-indigo-600 mb-2.5 px-0.5">F+</span>
              {[
                { label: 'Resumen',   active: true  },
                { label: 'Clientes',  active: false },
                { label: 'Programas', active: false },
                { label: 'Config',    active: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`text-[6px] rounded px-[3px] py-[2px] mb-[2px] leading-tight ${
                    item.active
                      ? 'bg-indigo-50 text-indigo-600 font-semibold'
                      : 'text-gray-400'
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </div>

            {/* Main content */}
            <div className="flex-1 bg-gray-50 p-2 overflow-hidden">
              <p className="text-[8px] font-bold text-gray-800 mb-1.5">Resumen</p>

              {/* Stat cards 2×2 */}
              <div className="grid grid-cols-2 gap-[4px] mb-2">
                {[
                  { label: 'Clientes',  value: '142', color: 'text-blue-600'   },
                  { label: 'Programas', value: '3',   color: 'text-purple-600' },
                  { label: 'Hoy',       value: '18',  color: 'text-green-600'  },
                  { label: 'Vouchers',  value: '5',   color: 'text-orange-500' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded border border-gray-100 px-1.5 py-1">
                    <p className="text-[5px] text-gray-400 leading-tight">{s.label}</p>
                    <p className={`text-[10px] font-bold leading-tight ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Activity list */}
              <div className="bg-white rounded border border-gray-100 p-1.5">
                <p className="text-[5px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                  Actividad reciente
                </p>
                {[
                  { name: 'Ana García',  action: '+80 pts',   c: 'text-green-600' },
                  { name: 'Luis Ramos',  action: 'Canje',     c: 'text-red-500'   },
                  { name: 'María Soto',  action: '+120 pts',  c: 'text-green-600' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between py-[2px] border-b border-gray-50 last:border-0">
                    <span className="text-[6px] text-gray-600">{a.name}</span>
                    <span className={`text-[6px] font-semibold ${a.c}`}>{a.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hinge strip */}
      <div className="h-[5px] bg-gray-700 rounded-b-sm" />
      {/* Keyboard base (trapezoidal feel via wider width) */}
      <div
        className="h-[10px] bg-gray-600 rounded-b-xl shadow-lg"
        style={{ marginLeft: -10, marginRight: -10 }}
      />
      {/* Trackpad hint */}
      <div className="absolute bottom-[3px] left-1/2 -translate-x-1/2 w-[32px] h-[5px] bg-gray-500 rounded-sm opacity-60" />
    </div>
  );
}

// ── Tablet mockup — shows the quick-register POS screen ───────────────────
function TabletMockup() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 168 }}>
      {/* Frame */}
      <div
        className="rounded-[22px] bg-gray-800 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.30)]"
        style={{ padding: 6 }}
      >
        {/* Top camera */}
        <div className="flex justify-center mb-[4px]">
          <div className="w-[5px] h-[5px] rounded-full bg-gray-600" />
        </div>

        {/* Screen */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ height: 226 }}>

          {/* App top bar */}
          <div className="flex items-center justify-between bg-white border-b border-gray-100 px-3 py-[5px]">
            <span className="text-[8px] font-extrabold text-indigo-600">Fideliza+</span>
            <span className="text-[6px] text-gray-400 font-medium">Registro rápido</span>
          </div>

          {/* Body */}
          <div className="bg-gray-50 p-2" style={{ height: 'calc(100% - 22px)' }}>

            {/* Search input */}
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2 py-[5px] mb-2 shadow-sm">
              <svg className="w-[8px] h-[8px] text-gray-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <span className="text-[7px] text-gray-300">Buscar cliente…</span>
            </div>

            {/* Customer card */}
            <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
              {/* Avatar + name */}
              <div className="flex items-center gap-2 mb-2">
                <div className="w-[22px] h-[22px] rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                  <span className="text-[8px] font-bold text-white">A</span>
                </div>
                <div>
                  <p className="text-[8px] font-semibold text-gray-800 leading-tight">Ana García</p>
                  <p className="text-[6px] font-mono text-indigo-500">ANA-2891</p>
                </div>
                <span className="ml-auto text-[5px] font-medium bg-green-50 text-green-700 rounded-full px-1 py-[1px]">Activo</span>
              </div>

              {/* Balance */}
              <div className="bg-indigo-50 rounded-lg px-2 py-1.5 text-center mb-2">
                <p className="text-[5px] text-indigo-400 uppercase tracking-wide">Saldo</p>
                <p className="text-[16px] font-bold text-indigo-600 leading-none">280</p>
                <p className="text-[5px] text-indigo-400">puntos</p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1">
                <div className="flex-1 bg-indigo-600 rounded-lg py-[5px] text-center">
                  <span className="text-[7px] font-semibold text-white">+ Asignar</span>
                </div>
                <div className="flex-1 bg-gray-100 rounded-lg py-[5px] text-center">
                  <span className="text-[7px] font-medium text-gray-500">Canjear</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Home bar */}
        <div className="flex justify-center mt-[5px]">
          <div className="w-[36px] h-[3px] rounded-full bg-gray-500" />
        </div>
      </div>
    </div>
  );
}

// ── Phone mockup — shows the customer loyalty portal ──────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto select-none" style={{ width: 118 }}>
      {/* Frame */}
      <div
        className="rounded-[30px] bg-gray-900 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.36)]"
        style={{ padding: 5 }}
      >
        {/* Dynamic island */}
        <div className="flex justify-center mb-[4px]">
          <div className="w-[26px] h-[7px] rounded-full bg-black" />
        </div>

        {/* Screen */}
        <div className="rounded-[24px] bg-white overflow-hidden" style={{ height: 234 }}>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 pt-[3px] pb-[1px] bg-white">
            <span className="text-[5px] font-semibold text-gray-800">9:41</span>
            <div className="flex items-center gap-[3px]">
              {/* Signal bars */}
              <div className="flex items-end gap-[1px] h-[5px]">
                {[2, 3, 4, 5].map((h, i) => (
                  <div key={i} className="w-[2px] bg-gray-800 rounded-[1px]" style={{ height: h }} />
                ))}
              </div>
              {/* Battery */}
              <div className="relative flex items-center">
                <div className="w-[10px] h-[5px] border border-gray-600 rounded-[1.5px] overflow-hidden">
                  <div className="h-full bg-green-500 rounded-[1px]" style={{ width: '75%' }} />
                </div>
                <div className="w-[1.5px] h-[3px] bg-gray-500 rounded-r-[1px] ml-[0.5px]" />
              </div>
            </div>
          </div>

          {/* App content */}
          <div className="px-2.5 pb-2.5">

            {/* Header */}
            <div className="text-center mb-2">
              <p className="text-[7px] font-extrabold text-indigo-600 leading-tight">Fideliza+</p>
              <p className="text-[6px] text-gray-400">Hola, Ana García</p>
            </div>

            {/* Loyalty card */}
            <div
              className="rounded-2xl p-2.5 mb-2 shadow-md"
              style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}
            >
              <p className="text-[6px] text-indigo-200 mb-[1px]">Brew Points</p>
              <div className="flex items-end gap-1">
                <p className="text-[22px] font-bold text-white leading-none">280</p>
                <p className="text-[6px] text-indigo-200 mb-[2px]">pts</p>
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 bg-white/25 rounded-full overflow-hidden" style={{ height: 3 }}>
                <div className="bg-white h-full rounded-full" style={{ width: '65%' }} />
              </div>
              <p className="text-[5px] text-indigo-200 mt-[3px]">150 pts para el próximo premio</p>
            </div>

            {/* Stamp card */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-2 mb-2">
              <p className="text-[6px] font-semibold text-gray-600 mb-1.5">Tarjeta de sellos</p>
              <div className="flex flex-wrap gap-[3px]">
                {Array.from({ length: 10 }, (_, i) => (
                  <div
                    key={i}
                    className={`w-[9px] h-[9px] rounded-full ${
                      i < 7 ? 'bg-indigo-500' : 'border border-gray-200 bg-white'
                    }`}
                  />
                ))}
              </div>
              <p className="text-[5px] text-gray-400 mt-[3px]">7 / 10 — ¡3 más para tu premio!</p>
            </div>

            {/* Recent transactions */}
            <div>
              <p className="text-[5px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Reciente</p>
              {[
                { label: 'Café americano', pts: '+80', c: 'text-green-600' },
                { label: 'Canje desayuno', pts: '−100', c: 'text-red-500'  },
              ].map((tx, i) => (
                <div key={i} className="flex justify-between items-center py-[2px] border-b border-gray-50 last:border-0">
                  <span className="text-[6px] text-gray-500">{tx.label}</span>
                  <span className={`text-[6px] font-semibold ${tx.c}`}>{tx.pts}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Home bar */}
        <div className="flex justify-center mt-[5px]">
          <div className="w-[28px] h-[3px] rounded-full bg-gray-600" />
        </div>
      </div>
    </div>
  );
}

// ── Accent configs per device ──────────────────────────────────────────────
const ACCENTS = [
  { dot: 'bg-indigo-500', ring: 'ring-indigo-100', bg: 'from-indigo-50/60' },
  { dot: 'bg-violet-500', ring: 'ring-violet-100', bg: 'from-violet-50/60' },
  { dot: 'bg-sky-500',    ring: 'ring-sky-100',    bg: 'from-sky-50/60'    },
];

const MOCKUPS = [<LaptopMockup key="laptop" />, <TabletMockup key="tablet" />, <PhoneMockup key="phone" />];

// ── Main section ──────────────────────────────────────────────────────────
export function MultiDevice({ t }: MultiDeviceProps) {
  return (
    <section className="py-20 sm:py-28 bg-gray-50">
      <Container>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
            {t.label}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5">
            {t.heading}
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            {t.body}
          </p>
        </div>

        {/* Device cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {t.devices.map((device, i) => (
            <div
              key={device.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden"
            >
              {/* Mockup area */}
              <div className={`bg-gradient-to-b ${ACCENTS[i].bg} to-white flex items-end justify-center px-4 pt-10 pb-6 min-h-[220px]`}>
                {MOCKUPS[i]}
              </div>

              {/* Text area */}
              <div className="flex flex-col flex-1 px-6 pt-5 pb-6 border-t border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-1.5">
                  {device.name}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {device.description}
                </p>
                <div className="mt-auto flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${ACCENTS[i].dot}`} />
                  <span className="text-xs text-gray-400">{device.hint}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wi-Fi note */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
          <WifiIcon className="h-4 w-4 shrink-0" />
          <span>{t.wifi}</span>
        </div>

      </Container>
    </section>
  );
}

function WifiIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}
