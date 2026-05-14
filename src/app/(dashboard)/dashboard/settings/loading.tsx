export default function Loading() {
  return (
    <div className="space-y-5 animate-pulse max-w-2xl">
      <div className="h-6 w-32 rounded bg-gray-200" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="rounded-xl border bg-white p-6 shadow-sm space-y-4">
          <div className="h-4 w-36 rounded bg-gray-200" />
          <div className="space-y-3">
            <div className="h-9 w-full rounded-lg bg-gray-200" />
            <div className="h-9 w-full rounded-lg bg-gray-200" />
          </div>
          <div className="h-9 w-28 rounded-lg bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
