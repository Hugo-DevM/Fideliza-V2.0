import { notFound } from 'next/navigation';

// Catch-all for unmatched /dashboard/* URLs so they render the
// dashboard-specific not-found.tsx (inside the dashboard shell)
// instead of the root/landing 404.
export default function DashboardCatchAll() {
  notFound();
}
