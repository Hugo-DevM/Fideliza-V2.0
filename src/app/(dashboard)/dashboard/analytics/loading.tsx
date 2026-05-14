export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 w-28 rounded bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border bg-white p-5 shadow-sm space-y-2">
            <div className="h-3 w-20 rounded bg-gray-200" />
            <div className="h-7 w-14 rounded bg-gray-200" />
          </div>
        ))}
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="h-4 w-32 rounded bg-gray-200 mb-4" />
        <div className="flex items-end gap-1 h-40">
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-gray-200"
              style={{ height: `${30 + Math.random() * 70}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
