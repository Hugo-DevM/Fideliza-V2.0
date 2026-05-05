import type { ReactNode } from 'react';

export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 pt-10 pb-2 border-b border-white/10 last:border-0">
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      <div className="space-y-4 text-gray-300 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-20 pt-8">
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <div className="space-y-3 text-gray-300 text-sm leading-relaxed">{children}</div>
    </div>
  );
}

export function GuiddeBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">
        <span>🎥</span> Video tutorial (Guidde)
      </p>
      <div className="text-gray-400 text-sm leading-relaxed space-y-1">{children}</div>
    </div>
  );
}

export function DataTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: string[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-white/10 mt-2">
      <table className="w-full text-sm">
        <thead className="bg-white/5">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-white/[0.02]">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 text-gray-300 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StepList({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-2 pl-1">
      {steps.map((step, i) => (
        <li key={i} className="flex gap-3">
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center mt-0.5">
            {i + 1}
          </span>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-amber-200/80 text-xs">
      <span className="font-semibold">{'⚠ '}</span>
      {children}
    </div>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="font-mono text-indigo-300">{children}</code>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg bg-white/5 border border-white/10 px-4 py-3 font-mono text-sm text-center tracking-wide">
      {children}
    </div>
  );
}
