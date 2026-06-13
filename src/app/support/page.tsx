'use client';

import { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

/* ─── Shared primitives ─────────────────────────────────────────────────── */

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="section-reveal scroll-mt-20 text-lg font-semibold text-white mt-10 mb-3 border-b border-white/10 pb-2">
      {children}
    </h2>
  );
}
function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="text-base font-semibold text-white mt-5 mb-2">{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="text-gray-300 text-sm leading-relaxed mb-3">{children}</p>;
}
function UL({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5 mb-3">
      {items.map((i) => <li key={i} className="text-gray-300 text-sm leading-relaxed">{i}</li>)}
    </ul>
  );
}
function Highlight({ children }: { children: React.ReactNode }) {
  return <span className="text-white font-medium">{children}</span>;
}
function ContactCard({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center gap-4 rounded-lg border border-white/10 bg-white/5 px-5 py-4 hover:bg-white/10 hover:border-white/20 transition-colors"
    >
      <span className="text-indigo-400 shrink-0">{icon}</span>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className="text-sm text-white font-medium">{value}</p>
      </div>
    </a>
  );
}
function Brand() {
  return <strong className="text-indigo-400 font-bold">Fideliza</strong>;
}

/* ─── Content ───────────────────────────────────────────────────────────── */

function SupportEs() {
  return (
    <>
      <P>
        En <Brand /> estamos aquí para ayudarte. Revisa las preguntas frecuentes o contáctanos
        directamente y te responderemos a la brevedad.
      </P>

      {/* Contact channels */}
      <H2 id="contacto">Contacto directo</H2>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <ContactCard
          href="mailto:support@fideliza.app"
          label="Soporte general"
          value="support@fideliza.app"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
        />
        <ContactCard
          href="mailto:billing@fideliza.app"
          label="Facturación y pagos"
          value="billing@fideliza.app"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          }
        />
      </div>
      <P>
        Tiempo de respuesta estimado: <Highlight>24–48 horas hábiles</Highlight>.
        Los usuarios del plan Pro reciben soporte prioritario.
      </P>

      {/* FAQ */}
      <H2 id="faq">Preguntas frecuentes</H2>

      <H3>¿Cómo cancelo mi suscripción?</H3>
      <P>
        Ve a <Highlight>Dashboard → Configuración → Facturación</Highlight> y haz clic en
        "Gestionar suscripción". Desde ahí podrás cancelar en cualquier momento. El acceso
        al plan se mantiene hasta el final del período pagado.
      </P>

      <H3>¿Puedo cambiar de plan en cualquier momento?</H3>
      <P>
        Sí. Puedes actualizar o degradar tu plan desde la sección de Facturación en
        Configuración. Los cambios se aplican inmediatamente o al inicio del siguiente ciclo,
        según el tipo de cambio.
      </P>

      <H3>Olvidé mi contraseña, ¿qué hago?</H3>
      <P>
        En la pantalla de inicio de sesión, haz clic en <Highlight>"¿Olvidaste tu contraseña?"</Highlight>.
        Te enviaremos un enlace de recuperación a tu correo registrado.
      </P>

      <H3>¿Cómo acceden mis clientes al portal de fidelización?</H3>
      <P>
        Tus clientes acceden mediante tu subdominio único (<Highlight>tu-negocio.fideliza.app</Highlight>)
        e ingresan el código de acceso que les asignaste. No necesitan crear una cuenta ni
        recordar una contraseña.
      </P>

      <H3>¿Puedo exportar mis datos?</H3>
      <P>
        Los usuarios del plan Pro pueden exportar clientes y transacciones en formato CSV
        desde la sección de Analíticas. Si necesitas una exportación completa de tus datos,
        contáctanos a <Highlight>support@fideliza.app</Highlight>.
      </P>

      <H3>¿Qué pasa si no pago a tiempo?</H3>
      <P>
        Stripe intentará el cobro automáticamente. Si el pago falla, tu cuenta se degradará
        al plan Gratis y tus datos se conservarán por 90 días para que puedas reactivar el
        servicio.
      </P>

      <H3>¿Cómo elimino mi cuenta?</H3>
      <P>
        Ve a <Highlight>Dashboard → Configuración → Zona de peligro</Highlight> y selecciona
        "Eliminar cuenta". Esta acción es irreversible. Si tienes problemas para acceder,
        escríbenos a <Highlight>support@fideliza.app</Highlight>.
      </P>

      <H2 id="manual">Manual de usuario</H2>
      <P>
        Consulta nuestro manual completo para aprender a configurar programas, gestionar
        clientes y sacar el máximo provecho de <Brand />.
      </P>
      <a
        href="/manual"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
      >
        Ver manual de usuario
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </>
  );
}

function SupportEn() {
  return (
    <>
      <P>
        At <Brand /> we're here to help. Browse the FAQs below or contact us directly
        and we'll get back to you as soon as possible.
      </P>

      {/* Contact channels */}
      <H2 id="contacto">Contact us</H2>
      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <ContactCard
          href="mailto:support@fideliza.app"
          label="General support"
          value="support@fideliza.app"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          }
        />
        <ContactCard
          href="mailto:billing@fideliza.app"
          label="Billing & payments"
          value="billing@fideliza.app"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
            </svg>
          }
        />
      </div>
      <P>
        Estimated response time: <Highlight>24–48 business hours</Highlight>.
        Pro plan users receive priority support.
      </P>

      {/* FAQ */}
      <H2 id="faq">Frequently asked questions</H2>

      <H3>How do I cancel my subscription?</H3>
      <P>
        Go to <Highlight>Dashboard → Settings → Billing</Highlight> and click
        "Manage subscription". You can cancel at any time. Access to the plan continues
        until the end of the paid period.
      </P>

      <H3>Can I change plans at any time?</H3>
      <P>
        Yes. You can upgrade or downgrade your plan from the Billing section in Settings.
        Changes take effect immediately or at the start of the next billing cycle,
        depending on the type of change.
      </P>

      <H3>I forgot my password. What do I do?</H3>
      <P>
        On the login screen, click <Highlight>"Forgot your password?"</Highlight>. We'll
        send a recovery link to your registered email address.
      </P>

      <H3>How do my customers access the loyalty portal?</H3>
      <P>
        Customers access via your unique subdomain (<Highlight>your-business.fideliza.app</Highlight>)
        and enter the access code you assigned them. They don't need to create an account
        or remember a password.
      </P>

      <H3>Can I export my data?</H3>
      <P>
        Pro plan users can export customers and transactions as CSV from the Analytics
        section. For a full data export, contact us at <Highlight>support@fideliza.app</Highlight>.
      </P>

      <H3>What happens if I miss a payment?</H3>
      <P>
        Stripe will automatically retry the charge. If the payment fails, your account
        will be downgraded to the Free plan and your data will be retained for 90 days
        so you can reactivate the service.
      </P>

      <H3>How do I delete my account?</H3>
      <P>
        Go to <Highlight>Dashboard → Settings → Danger zone</Highlight> and select
        "Delete account". This action is irreversible. If you have trouble accessing
        your account, email us at <Highlight>support@fideliza.app</Highlight>.
      </P>

      <H2 id="manual">User manual</H2>
      <P>
        Check out our full user manual to learn how to set up programs, manage customers
        and get the most out of <Brand />.
      </P>
      <a
        href="/manual"
        className="inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
      >
        View user manual
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </a>
    </>
  );
}

/* ─── Page shell ─────────────────────────────────────────────────────────── */

export default function SupportPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('landing-lang');
    if (saved === 'en' || saved === 'es') setLang(saved);
    setMounted(true);
  }, []);

  function handleLangChange(newLang: 'es' | 'en') {
    setLang(newLang);
    localStorage.setItem('landing-lang', newLang);
  }

  if (!mounted) return null;

  const isEs = lang === 'es';
  const title = isEs ? 'Centro de Soporte' : 'Support Center';
  const updated = isEs ? 'Fideliza · Soporte técnico y ayuda' : 'Fideliza · Technical support & help';
  const backLabel = isEs ? 'Volver al inicio' : 'Back to home';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ScrollReveal deps={[lang]} />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-white/10">
        <Container className="flex items-center justify-between h-14">
          <a href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {backLabel}
          </a>
          <button
            type="button"
            onClick={() => handleLangChange(isEs ? 'en' : 'es')}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-white border border-white/10 hover:border-white/30 rounded-md px-3 py-1.5 transition-colors"
            aria-label={isEs ? 'Switch to English' : 'Cambiar a Español'}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
            </svg>
            {isEs ? 'English' : 'Español'}
          </button>
        </Container>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-indigo-950/40 to-gray-950 border-b border-white/10">
        <Container className="py-12">
          <div className="flex items-center justify-between gap-8">
            <div>
              <h1 className="animate-fade-in text-3xl sm:text-4xl font-bold text-white mb-2">{title}</h1>
              <p className="animate-fade-in-delay-1 text-gray-500 text-sm">{updated}</p>
            </div>
            <img src="/logofideliza.svg" alt="Fideliza" className="hidden sm:block h-24 opacity-80" />
          </div>
        </Container>
      </div>

      {/* ── Content ── */}
      <Container className="py-10 max-w-3xl">
        {isEs ? <SupportEs /> : <SupportEn />}

        <div className="pt-10 pb-4 text-center text-xs text-gray-600 border-t border-white/5 mt-10">
          <strong className="text-indigo-400 font-bold">Fideliza</strong> · {isEs ? 'Soporte' : 'Support'} ·{' '}
          <a href="/terms" className="hover:text-gray-400 transition-colors">
            {isEs ? 'Términos de servicio' : 'Terms of service'}
          </a>
          {' · '}
          <a href="/privacy" className="hover:text-gray-400 transition-colors">
            {isEs ? 'Privacidad' : 'Privacy'}
          </a>
        </div>
      </Container>
    </div>
  );
}
