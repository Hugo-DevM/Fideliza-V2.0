export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="h-3 w-20 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          <div className="h-7 w-48 rounded-lg bg-gray-200 dark:bg-[#1e2438]" />
          <div className="h-3 w-72 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
        </div>
        {/* Period selector skeleton */}
        <div className="flex items-center gap-1 rounded-xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] p-1 shrink-0">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-8 w-16 rounded-lg bg-gray-100 dark:bg-[#1e2438]" />
          ))}
        </div>
      </div>

      {/* Export panel skeleton */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
            <div className="h-3 w-52 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          </div>
          <div className="h-7 w-20 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-gray-100 dark:border-[#1e2438] p-3.5 space-y-2">
              <div className="h-9 w-9 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
              <div className="h-4 w-24 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
              <div className="h-3 w-full rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            </div>
          ))}
        </div>
        <div className="flex items-end justify-between gap-3">
          <div className="flex gap-3">
            <div className="space-y-1.5">
              <div className="h-3 w-10 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
              <div className="h-9 w-36 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
            </div>
            <div className="space-y-1.5">
              <div className="h-3 w-10 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
              <div className="h-9 w-36 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
            </div>
          </div>
          <div className="h-10 w-36 rounded-xl bg-gray-200 dark:bg-[#1e2438]" />
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-10 w-10 rounded-2xl bg-gray-100 dark:bg-[#1e2438]" />
              <div className="h-5 w-12 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            </div>
            <div className="h-8 w-16 rounded-lg bg-gray-200 dark:bg-[#1e2438]" />
            <div className="h-3 w-24 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
          <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-[#1e2438] mb-6" />
          <div className="flex items-end gap-2 h-40">
            {[55, 40, 70, 30, 85, 60].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-lg bg-gray-100 dark:bg-[#1e2438]"
                  style={{ height: `${h}%` }}
                />
                <div className="h-2 w-6 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
              </div>
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
          <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-[#1e2438] mb-6" />
          <div className="flex flex-col items-center gap-4">
            <div className="h-32 w-32 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
            <div className="w-full space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
                    <div className="h-3 w-12 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
                  </div>
                  <div className="h-3 w-8 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top customers */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
            <div className="h-4 w-32 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          </div>
          <div className="divide-y divide-gray-50 dark:divide-[#1e2438]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-28 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
                  <div className="h-2.5 w-16 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
                </div>
                <div className="h-5 w-10 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
              </div>
            ))}
          </div>
        </div>

        {/* At-risk */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
            <div className="h-4 w-36 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
          </div>
          <div className="divide-y divide-gray-50 dark:divide-[#1e2438]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-8 w-8 rounded-xl bg-gray-100 dark:bg-[#1e2438]" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-24 rounded-full bg-gray-200 dark:bg-[#1e2438]" />
                  <div className="h-2.5 w-32 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
                </div>
                <div className="h-5 w-14 rounded-full bg-gray-100 dark:bg-[#1e2438]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
