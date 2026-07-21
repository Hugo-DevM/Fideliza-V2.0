import Image from "next/image";
import { Container } from "@/components/ui/Container";
import type { Dictionary } from "@/lib/i18n";

interface FooterProps {
  t: Dictionary["footer"];
}

export function Footer({ t }: FooterProps) {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <Container>
        <div className="py-12 grid grid-cols-1 sm:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="mb-3">
              <Image src="/logofideliza.svg" alt="Fideliza" width={144} height={48} className="h-12 w-auto" />
            </div>
            <p className="text-sm leading-relaxed max-w-xs">{t.tagline}</p>
          </div>

          {/* Product links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t.product}
            </h3>
            <ul className="space-y-2.5">
              {t.nav.product.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              {t.legal}
            </h3>
            <ul className="space-y-2.5">
              {t.nav.legal.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm hover:text-white transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <p>
            &copy; {new Date().getFullYear()}{" "}
            <span className="font-semibold">Fideliza</span>. {t.copyright}
          </p>
          <p>{t.bottomTagline}</p>
        </div>
      </Container>
    </footer>
  );
}
