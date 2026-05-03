// Route group for future marketing sub-pages (e.g. /about, /blog).
// Landing page lives at /[lang]/page.tsx — see app/[lang]/ for i18n routing.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
