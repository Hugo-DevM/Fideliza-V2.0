import type { Metadata } from "next";
import { Space_Grotesk, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { CookieBanner } from "@/components/analytics/CookieBanner";
import { MetaPixel } from "@/components/analytics/MetaPixel";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://fideliza.app"),
  title: {
    default: "Fideliza — Programa de lealtad para tu negocio",
    template: "%s | Fideliza",
  },
  description:
    "Run a loyalty program your customers actually use — no app downloads, no complex setup. Points, stamps, and visits. Your own branded subdomain. Up and running in under 5 minutes.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    url: "https://fideliza.app",
    siteName: "Fideliza",
    title: "Fideliza — Programa de lealtad para tu negocio",
    description:
      "Run a loyalty program your customers actually use — no app downloads, no complex setup. Points, stamps, and visits. Up and running in under 5 minutes.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Fideliza — Programa de lealtad para tu negocio",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fideliza — Programa de lealtad para tu negocio",
    description:
      "Run a loyalty program your customers actually use — no app downloads, no complex setup. Points, stamps, and visits. Up and running in under 5 minutes.",
    images: ["/og-image.jpg"],
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
  const lang = headersList.get("x-locale") ?? "en";

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
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(t==null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        {/* Schema markup — helps AI and search engines understand what Fideliza is */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Fideliza",
              "url": "https://fideliza.app",
              "logo": "https://fideliza.app/icon.svg",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "inLanguage": ["es", "en"],
              "description": "Sistema de programas de lealtad digital para pequeños y medianos negocios en México y Latinoamérica. Sin app, sin descargas — los clientes usan un código único. Incluye programas de puntos, sellos y visitas, panel de administración, subdominio propio y exportación de datos.",
              "keywords": "programa de lealtad, fidelización de clientes, puntos de lealtad, tarjeta de sellos digital, loyalty program Mexico, retención de clientes, programa de puntos para negocios",
              "offers": [
                {
                  "@type": "Offer",
                  "name": "Plan Gratis",
                  "price": "0",
                  "priceCurrency": "MXN",
                  "description": "Hasta 50 clientes, 1 programa de lealtad"
                },
                {
                  "@type": "Offer",
                  "name": "Plan Starter",
                  "price": "349",
                  "priceCurrency": "MXN",
                  "description": "Hasta 500 clientes, hasta 3 programas de lealtad"
                },
                {
                  "@type": "Offer",
                  "name": "Plan Pro",
                  "price": "699",
                  "priceCurrency": "MXN",
                  "description": "Clientes ilimitados, programas ilimitados, exportación CSV"
                }
              ],
              "featureList": [
                "Programas de puntos, sellos y visitas",
                "Sin app ni descarga para el cliente",
                "Código único por cliente",
                "Subdominio propio (tunegocio.fideliza.app)",
                "Panel de administración completo",
                "Exportación de datos CSV",
                "Historial de transacciones",
                "Catálogo de recompensas"
              ],
              "provider": {
                "@type": "Organization",
                "name": "Fideliza",
                "url": "https://fideliza.app"
              }
            })
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
