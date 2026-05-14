export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 rounded bg-gray-200" />
          <div className="h-3.5 w-24 rounded bg-gray-100" />
          <div className="h-3.5 w-20 rounded bg-gray-100" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-gray-200" />
          <div className="h-9 w-24 rounded-lg bg-gray-200" />
        </div>
      </div>
      {/* Enrollment cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
            <div className="h-4 w-32 rounded bg-gray-200" />
            <div className="h-8 w-20 rounded bg-gray-200" />
            <div className="h-2 w-full rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
      {/* Transactions */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="border-b px-5 py-3.5">
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b last:border-0">
            <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-40 rounded bg-gray-200" />
              <div className="h-2.5 w-28 rounded bg-gray-100" />
            </div>
            <div className="h-3.5 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
