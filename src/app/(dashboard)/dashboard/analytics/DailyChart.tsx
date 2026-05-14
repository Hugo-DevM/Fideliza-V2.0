'use client';

/**
 * Bar chart for daily activity — rendered client-side so date labels
 * use the browser's local timezone, not the server's UTC clock.
 * The server passes raw counts keyed by UTC date string; the client
 * generates the 14-day range using local dates and looks up each day.
 */

function localDateKey(d: Date): string {
  return (
    d.getFullYear() +
    '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0')
  );
}

export default function DailyChart({ txCounts }: { txCounts: Record<string, number> }) {
  const today = new Date();

  // Generate exactly 14 days ending TODAY (local), oldest first
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const key = localDateKey(d);
    return {
      key,
      label: d.toLocaleDateString('es', { day: 'numeric', month: 'numeric' }),
      value: txCounts[key] ?? 0,
    };
  });

  const max = Math.max(...days.map((d) => d.value), 1);

  return (
    <div className="overflow-x-auto -mx-1">
      <div className="flex items-end gap-1 h-36 min-w-[360px] px-1">
        {days.map((d) => (
          <div key={d.key} className="flex flex-col items-center flex-1 gap-1 h-full justify-end">
            <span className="text-[10px] text-gray-400 leading-none">{d.value || ''}</span>
            <div
              className="w-full rounded-t-sm bg-indigo-500 transition-all"
              style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%` }}
            />
            <span className="text-[9px] text-gray-400 leading-none truncate w-full text-center">
              {d.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
