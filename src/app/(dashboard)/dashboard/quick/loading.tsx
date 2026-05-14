export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-6 w-36 rounded bg-gray-200" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-gray-200" />
            <div className="h-9 w-20 rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm space-y-3">
          <div className="h-4 w-32 rounded bg-gray-200" />
          <div className="flex gap-2">
            <div className="h-9 flex-1 rounded-lg bg-gray-200" />
            <div className="h-9 w-24 rounded-lg bg-gray-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
