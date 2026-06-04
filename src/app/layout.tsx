import type { Metadata } from 'next';
import { Space_Grotesk, Geist_Mono } from 'next/font/google';
import { headers } from 'next/headers';
import { CookieBanner } from '@/components/analytics/CookieBanner';
import { MetaPixel } from '@/components/analytics/MetaPixel';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  variable: '--font-space-grotesk',
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
  openGraph: {
    type: 'website',
    url: 'https://fideliza.app',
    siteName: 'Fideliza+',
    title: 'Fideliza+ — Loyalty Programs for Independent Businesses',
    description:
      'Run a loyalty program your customers actually use — no app downloads, no complex setup. Points, stamps, and visits. Up and running in under 5 minutes.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Fideliza+ — Loyalty Programs for Independent Businesses',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fideliza+ — Loyalty Programs for Independent Businesses',
    description:
      'Run a loyalty program your customers actually use — no app downloads, no complex setup. Points, stamps, and visits. Up and running in under 5 minutes.',
    images: ['/og-image.jpg'],
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
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Prevent dark mode flash before hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <MetaPixel />
        <CookieBanner lang={lang} />
      </body>
    </html>
  );
}
