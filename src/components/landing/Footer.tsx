import { Container } from '@/components/ui/Container';
import type { Dictionary } from '@/lib/i18n';

interface FooterProps {
  t: Dictionary['footer'];
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <Container>
        <div className="py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
                </svg>
              </div>
              <span className="text-white font-semibold text-sm">
                Fideliza<span className="text-indigo-400">+</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">{t.tagline}</p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t.product}</h3>
            <ul className="space-y-2.5">
              {t.nav.product.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">{t.legal}</h3>
            <ul className="space-y-2.5">
              {t.nav.legal.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} Fideliza+. {t.copyright}</p>
          <p>{t.bottomTagline}</p>
        </div>
      </Container>
    </footer>
  );
}
