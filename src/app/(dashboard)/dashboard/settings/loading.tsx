export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-14 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          <div className="h-8 w-52 rounded-lg bg-gray-200 dark:bg-[#1e2438]" />
          <div className="h-3 w-72 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
        </div>
        <div className="h-10 w-36 shrink-0 rounded-xl bg-gray-200 dark:bg-[#1e2438]" />
      </div>

      {/* ── Cuenta card ───────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="h-4 w-16 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="h-3 w-28 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            <div className="h-4 w-44 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-20 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          <div className="h-10 w-full rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
        </div>
      </div>

      {/* ── Facturación card ──────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          <div className="h-7 w-36 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
        </div>
        <div className="flex gap-4">
          <div className="space-y-1.5">
            <div className="h-3 w-16 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            <div className="h-6 w-20 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          </div>
        </div>
        <div className="h-14 w-full rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
      </div>

      {/* ── Apariencia card ───────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
            <div className="h-3 w-40 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          </div>
          <div className="h-4 w-28 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-24 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
              <div className="flex items-center gap-2">
                <div className="h-9 w-12 rounded-lg bg-gray-200 dark:bg-[#1e2438]" />
                <div className="h-9 flex-1 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
              </div>
            </div>
          ))}
        </div>
        <div className="h-20 w-full rounded-xl bg-gray-200 dark:bg-[#1e2438]" />
      </div>

      {/* ── Portal del cliente card ───────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="space-y-1.5">
          <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          <div className="h-3 w-64 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
        </div>
        <div className="h-10 w-full rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
        <div className="space-y-1.5">
          <div className="h-3 w-36 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          <div className="h-20 w-full rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          <div className="h-9 w-48 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
          <div className="h-24 w-full rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
        </div>
      </div>

      {/* ── Zona de peligro card ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-gray-200 dark:border-red-500/20 bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-100 dark:border-red-500/20 px-5 py-3 bg-gray-50 dark:bg-red-500/5">
          <div className="h-3 w-3 rounded-full bg-red-200 dark:bg-red-500/30" />
          <div className="h-3 w-24 rounded-full bg-red-200 dark:bg-red-500/20" />
        </div>
        <div className="flex items-center justify-between gap-6 px-5 py-4">
          <div className="space-y-1.5 flex-1">
            <div className="h-4 w-40 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
            <div className="h-3 w-full max-w-sm rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          </div>
          <div className="h-9 w-32 shrink-0 rounded-xl bg-red-100 dark:bg-red-500/20" />
        </div>
      </div>

    </div>
  );
}
