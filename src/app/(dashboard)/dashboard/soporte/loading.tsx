const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Page title */}
      <div className="space-y-2">
        <div className={`h-7 w-44 ${S}`} />
        <div className={`h-4 w-72 ${S}`} />
      </div>

      {/* New ticket form card */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#0f1222] p-6 space-y-4">
        <div className={`h-5 w-28 ${S}`} />

        {/* Subject field */}
        <div className="space-y-1.5">
          <div className={`h-3 w-16 ${S}`} />
          <div className={`h-10 w-full ${S}`} />
        </div>

        {/* Message field */}
        <div className="space-y-1.5">
          <div className={`h-3 w-20 ${S}`} />
          <div className={`h-28 w-full ${S}`} />
        </div>

        <div className={`h-9 w-32 ${S}`} />
      </div>

      {/* Ticket history card */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#0f1222] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#1e2438]">
          <div className={`h-5 w-40 ${S}`} />
        </div>
        <div className="divide-y divide-gray-100 dark:divide-[#1e2438]">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="px-6 py-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div className={`h-4 w-56 ${S}`} />
                <div className={`h-5 w-20 rounded-full ${S}`} />
              </div>
              <div className={`h-12 w-full ${S}`} />
              <div className={`h-3 w-32 ${S}`} />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
