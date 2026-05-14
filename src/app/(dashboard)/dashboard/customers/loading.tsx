export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-6 w-24 rounded bg-gray-200" />
          <div className="h-3.5 w-16 rounded bg-gray-100" />
        </div>
        <div className="h-9 w-32 rounded-lg bg-gray-200" />
      </div>
      <div className="h-9 w-72 rounded-lg bg-gray-200" />
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="border-b bg-gray-50 px-4 py-3 flex gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-3 w-20 rounded bg-gray-200" />
          ))}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b last:border-0">
            <div className="h-3.5 w-32 rounded bg-gray-200" />
            <div className="h-3.5 w-24 rounded bg-gray-200" />
            <div className="h-3.5 w-24 rounded bg-gray-100" />
            <div className="h-5 w-14 rounded-full bg-gray-100" />
            <div className="h-3.5 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  );
}
