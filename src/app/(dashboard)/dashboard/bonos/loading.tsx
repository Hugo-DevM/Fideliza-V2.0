const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Page title */}
      <div className="space-y-2">
        <div className={`h-7 w-40 ${S}`} />
        <div className={`h-4 w-80 ${S}`} />
      </div>

      {/* Config card */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#0f1222] p-6 space-y-5">
        <div className={`h-5 w-48 ${S}`} />

        {/* Birthday section */}
        <div className="space-y-3">
          <div className={`h-4 w-40 ${S}`} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={`h-3 w-28 ${S}`} />
              <div className={`h-10 w-full ${S}`} />
            </div>
            <div className="space-y-1.5">
              <div className={`h-3 w-20 ${S}`} />
              <div className={`h-10 w-full ${S}`} />
            </div>
          </div>
        </div>

        {/* Reactivation section */}
        <div className="space-y-3">
          <div className={`h-4 w-44 ${S}`} />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className={`h-3 w-28 ${S}`} />
              <div className={`h-10 w-full ${S}`} />
            </div>
            <div className="space-y-1.5">
              <div className={`h-3 w-20 ${S}`} />
              <div className={`h-10 w-full ${S}`} />
            </div>
          </div>
        </div>

        <div className={`h-9 w-32 ${S}`} />
      </div>

      {/* Pending bonuses table */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#0f1222] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2438] flex items-center justify-between">
          <div className={`h-5 w-36 ${S}`} />
          <div className={`h-3 w-16 ${S}`} />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#1e2438]">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="px-6 py-3 flex items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className={`h-4 w-32 ${S}`} />
                <div className={`h-3 w-48 ${S}`} />
              </div>
              <div className="text-right space-y-1.5">
                <div className={`h-4 w-16 ml-auto ${S}`} />
                <div className={`h-3 w-20 ml-auto ${S}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
