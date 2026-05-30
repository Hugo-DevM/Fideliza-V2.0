import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { CookieBanner } from '@/components/analytics/CookieBanner';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://fideliza.app'),
  title: {
    default: 'Fideliza+ — Loyalty Programs for Independent Businesses',
    template: '%s | Fideliza+',
  },
  description:
    'Run a loyalty program your customers actually use — no app downloads, no complex setup. Points, stamps, and visits. Your own branded subdomain. Up and running in under 5 minutes.',
  icons: {
    icon: '/logofpurple.svg',
    shortcut: '/logofpurple.svg',
    apple: '/logofpurple.svg',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Read the locale injected by middleware so <html lang> is accurate for
  // both screen readers and search engines without needing client JS.
  const headersList = await headers();
  const lang = headersList.get('x-locale') ?? 'en';

  return (
    <html
      lang={lang}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          {children}
          <MetaPixel />
          <CookieBanner lang={lang} />
        </body>
    </html>
  );
}
