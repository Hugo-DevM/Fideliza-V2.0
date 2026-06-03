/**
 * Customer portal layout — minimal, mobile-first shell.
 * No dashboard nav. No auth. Just the customer's loyalty card.
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Loyalty Card',
  description: 'View your rewards, points, and exclusive offers.',
  robots: { index: false, follow: false },
};

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
