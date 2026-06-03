const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className={`h-3 w-20 ${S}`} />
          <div className={`h-7 w-36 ${S}`} />
          <div className={`h-3.5 w-56 ${S}`} />
        </div>
        <div className={`h-10 w-36 ${S}`} />
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className={`h-12 w-12 rounded-2xl ${S}`} />
              <div className={`h-5 w-16 rounded-lg ${S}`} />
            </div>
            <div className={`h-6 w-40 ${S}`} />
            <div className={`h-5 w-16 rounded-full ${S}`} />
            <div className={`h-3.5 w-full ${S}`} />
            <div className={`h-3.5 w-4/5 ${S}`} />
            <div className="border-t border-gray-100 dark:border-[#1e2438]" />
            <div className="flex gap-5">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <div className={`h-5 w-8 ${S}`} />
                  <div className={`h-3 w-14 ${S}`} />
                </div>
              ))}
            </div>
          </div>
        ))}
        {/* Create card placeholder */}
        <div className="rounded-2xl border-2 border-dashed border-gray-100 dark:border-[#1e2438] p-8" />
      </div>
    </div>
  );
}
