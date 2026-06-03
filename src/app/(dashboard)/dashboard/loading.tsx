const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className={`h-3 w-12 ${S}`} />
          <div className={`h-7 w-52 ${S}`} />
          <div className={`h-3.5 w-72 ${S}`} />
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className={`h-9 w-28 ${S}`} />
          <div className={`h-9 w-36 ${S}`} />
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-4 space-y-3">
            {/* Icon + label */}
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-xl ${S}`} />
              <div className={`h-3 w-24 ${S}`} />
            </div>
            {/* Value */}
            <div className={`h-8 w-16 ${S}`} />
            {/* Trend + sparkline */}
            <div className="flex items-end justify-between gap-3">
              <div className={`h-3 w-20 ${S}`} />
              <div className={`h-9 w-24 rounded-lg ${S}`} />
            </div>
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">

        {/* Activity feed */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
            <div className={`h-3.5 w-32 ${S}`} />
            <div className={`h-3 w-20 ${S}`} />
          </div>
          <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
            {[...Array(6)].map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <div className={`h-8 w-8 shrink-0 rounded-xl ${S}`} />
                <div className="flex-1 space-y-1.5">
                  <div className={`h-3 w-48 ${S}`} />
                  <div className={`h-2.5 w-32 ${S}`} />
                </div>
                <div className={`h-3 w-14 ${S}`} />
              </li>
            ))}
          </ul>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Programs */}
          <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#1e2438] px-5 py-4">
              <div className={`h-3.5 w-24 ${S}`} />
              <div className={`h-3 w-16 ${S}`} />
            </div>
            <ul className="divide-y divide-gray-50 dark:divide-[#1e2438]">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="flex items-center justify-between px-5 py-3.5">
                  <div className="space-y-1.5">
                    <div className={`h-3.5 w-28 ${S}`} />
                    <div className={`h-2.5 w-16 ${S}`} />
                  </div>
                  <div className={`h-5 w-14 rounded-full ${S}`} />
                </li>
              ))}
            </ul>
          </div>

          {/* Portal card */}
          <div className="rounded-2xl bg-gray-100 dark:bg-[#1e2438] p-5 space-y-3">
            <div className={`h-2.5 w-24 rounded-xl bg-gray-200 dark:bg-[#2a3147]`} />
            <div className={`h-5 w-40 rounded-xl bg-gray-200 dark:bg-[#2a3147]`} />
            <div className={`h-9 w-full rounded-xl bg-gray-200 dark:bg-[#2a3147]`} />
            <div className={`h-3 w-56 rounded-xl bg-gray-200 dark:bg-[#2a3147]`} />
          </div>
        </div>
      </div>
    </div>
  );
}
