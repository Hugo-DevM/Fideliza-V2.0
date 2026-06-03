const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">

      {/* Hero card */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`h-14 w-14 shrink-0 rounded-2xl ${S}`} />
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className={`h-6 w-36 ${S}`} />
                <div className={`h-5 w-16 rounded-full ${S}`} />
                <div className={`h-5 w-14 rounded-full ${S}`} />
              </div>
              <div className="flex items-center gap-3">
                <div className={`h-7 w-24 rounded-lg ${S}`} />
                <div className={`h-4 w-28 ${S}`} />
                <div className={`h-4 w-40 ${S}`} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <div className={`h-9 w-20 ${S}`} />
            <div className={`h-9 w-24 ${S}`} />
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-4 space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className={`h-8 w-8 rounded-xl ${S}`} />
              <div className={`h-3 w-24 ${S}`} />
            </div>
            <div className={`h-8 w-16 ${S}`} />
            <div className={`h-3 w-20 ${S}`} />
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Programs */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
            <div className={`h-4 w-36 ${S}`} />
          </div>
          {[...Array(2)].map((_, i) => (
            <div key={i} className="px-5 py-4 space-y-3 border-b border-gray-50 dark:border-[#1e2438] last:border-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-9 w-9 rounded-xl ${S}`} />
                  <div className="space-y-1.5">
                    <div className={`h-3.5 w-32 ${S}`} />
                    <div className={`h-3 w-24 ${S}`} />
                  </div>
                </div>
                <div className={`h-6 w-12 ${S}`} />
              </div>
              <div className={`h-1.5 w-full rounded-full ${S}`} />
              <div className={`h-3 w-36 ${S}`} />
            </div>
          ))}
        </div>

        {/* Transactions */}
        <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-[#1e2438]">
            <div className={`h-4 w-44 ${S}`} />
          </div>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-gray-50 dark:border-[#1e2438] last:border-0">
              <div className={`h-8 w-8 shrink-0 rounded-xl ${S}`} />
              <div className="flex-1 space-y-1.5">
                <div className={`h-3.5 w-40 ${S}`} />
                <div className={`h-3 w-28 ${S}`} />
              </div>
              <div className={`h-3.5 w-16 ${S}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
