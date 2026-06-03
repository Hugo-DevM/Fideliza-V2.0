const S = 'bg-gray-100 dark:bg-[#1e2438] rounded-xl';

export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className={`h-3 w-24 ${S}`} />
          <div className={`h-7 w-36 ${S}`} />
          <div className={`h-3.5 w-72 ${S}`} />
        </div>
        <div className={`h-10 w-36 ${S}`} />
      </div>

      {/* Search + filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className={`h-10 flex-1 min-w-[200px] ${S}`} />
        <div className={`h-10 w-48 ${S}`} />
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#1e2438] bg-white dark:bg-[#161b2e] shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-6 border-b border-gray-100 dark:border-[#1e2438] px-5 py-3.5">
          {[140, 80, 96, 72, 80].map((w, i) => (
            <div key={i} className={`h-3 rounded-lg bg-gray-100 dark:bg-[#1e2438]`} style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex items-center gap-6 px-5 py-3.5 border-b border-gray-50 dark:border-[#1e2438] last:border-0">
            {/* Avatar + name */}
            <div className="flex items-center gap-3" style={{ width: 140 }}>
              <div className={`h-9 w-9 shrink-0 rounded-xl bg-gray-100 dark:bg-[#1e2438]`} />
              <div className={`h-3.5 flex-1 ${S}`} />
            </div>
            {/* Code pill */}
            <div className={`h-7 w-24 rounded-lg bg-gray-100 dark:bg-[#1e2438]`} />
            {/* Phone */}
            <div className={`h-3 w-24 ${S}`} />
            {/* Status */}
            <div className={`h-6 w-16 rounded-full bg-gray-100 dark:bg-[#1e2438]`} />
            {/* Date */}
            <div className={`h-3 w-20 ${S}`} />
          </div>
        ))}
      </div>
    </div>
  );
}
