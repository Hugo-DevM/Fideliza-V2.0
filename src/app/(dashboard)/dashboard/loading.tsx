export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="h-3 w-20 rounded bg-gray-200 mb-3" />
            <div className="h-7 w-14 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gray-200 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 rounded bg-gray-200" />
              <div className="h-2.5 w-32 rounded bg-gray-100" />
            </div>
            <div className="h-3 w-12 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
