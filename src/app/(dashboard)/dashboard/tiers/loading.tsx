const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Page title */}
      <div className="space-y-2">
        <div className={`h-7 w-36 ${S}`} />
        <div className={`h-4 w-96 ${S}`} />
      </div>

      {/* Distribution cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`rounded-2xl border border-gray-100 dark:border-[#1e2438] px-5 py-4 flex items-center gap-4 ${S}`}>
            <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-[#2a3147]" />
            <div className="space-y-2">
              <div className="h-3 w-16 rounded bg-gray-200 dark:bg-[#2a3147]" />
              <div className="h-7 w-10 rounded bg-gray-200 dark:bg-[#2a3147]" />
              <div className="h-3 w-24 rounded bg-gray-200 dark:bg-[#2a3147]" />
            </div>
          </div>
        ))}
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">

        {/* Header with toggle */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
          <div className="flex items-center gap-2.5">
            <div className={`h-8 w-8 rounded-xl ${S}`} />
            <div className="space-y-1.5">
              <div className={`h-4 w-24 ${S}`} />
              <div className={`h-3 w-64 ${S}`} />
            </div>
          </div>
          <div className={`h-6 w-11 rounded-full ${S}`} />
        </div>

        <div className="px-5 py-4 grid gap-6 lg:grid-cols-2 lg:items-start">

          {/* Conversion rates section */}
          <div className="space-y-3">
            <div className={`h-3.5 w-52 ${S}`} />
            <div className={`h-3 w-full ${S}`} />
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className={`h-3 w-36 ${S}`} />
                  <div className={`h-10 w-full rounded-xl ${S}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Tier levels section */}
          <div className="space-y-3">
            <div className={`h-3.5 w-28 ${S}`} />
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`rounded-xl border border-gray-100 dark:border-[#1e2438] px-4 py-3 space-y-3 ${S}`}>
                <div className="flex items-center gap-3">
                  <div className={`h-6 w-6 rounded-full bg-gray-200 dark:bg-[#2a3147]`} />
                  <div className={`h-8 flex-1 rounded-lg bg-gray-200 dark:bg-[#2a3147]`} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className={`h-3 w-40 bg-gray-200 dark:bg-[#2a3147] rounded`} />
                    <div className={`h-8 w-full rounded-lg bg-gray-200 dark:bg-[#2a3147]`} />
                  </div>
                  <div className="space-y-1.5">
                    <div className={`h-3 w-24 bg-gray-200 dark:bg-[#2a3147] rounded`} />
                    <div className="flex gap-1">
                      {[...Array(3)].map((_, j) => (
                        <div key={j} className={`h-8 flex-1 rounded-lg bg-gray-200 dark:bg-[#2a3147]`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-gray-100 dark:border-[#1e2438] px-5 py-3">
          <div className={`h-9 w-24 rounded-xl ${S}`} />
        </div>
      </div>

      {/* Info box */}
      <div className={`h-28 w-full rounded-2xl ${S}`} />
    </div>
  );
}
