import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isValidLocale, type Locale } from '@/lib/i18n';
import { Container } from '@/components/ui/Container';

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === 'es' ? 'Términos de Servicio' : 'Terms of Service',
  };
}

/* ─── Shared primitives ─────────────────────────────────────────────────── */

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 text-lg font-semibold text-white mt-10 mb-3 border-b border-white/10 pb-2">
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
function Warning({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-amber-200/80 text-xs mb-4">
      {children}
    </div>
  );
}

/* ─── Content ───────────────────────────────────────────────────────────── */

function TermsEs() {
  return (
    <>
      <P>
        <Highlight>Fecha de entrada en vigor: 5 de mayo de 2026.</Highlight>{' '}
        Estos Términos de Servicio (en adelante, "los Términos") regulan el acceso y uso
        de la plataforma Fideliza+ operada por Fideliza+ ("<Highlight>Fideliza+</Highlight>",
        "nosotros" o "nuestro"). Al registrarte o usar el servicio, aceptas estos Términos
        en su totalidad. Si no estás de acuerdo, no uses el servicio.
      </P>

      <H2 id="descripcion">1. Descripción del servicio</H2>
      <P>
        Fideliza+ es una plataforma de software como servicio (SaaS) que permite a negocios
        crear, gestionar y operar programas de fidelización de clientes. El servicio incluye:
      </P>
      <UL items={[
        'Panel de administración web para gestionar clientes, programas y recompensas',
        'Portal web para clientes finales, accesible mediante código de acceso único (sin contraseña)',
        'Subdominio propio por negocio (ej. tu-negocio.fideliza.app)',
        'Tipos de programas: puntos, sellos, visitas y cashback (disponibilidad según plan)',
        'Gestión de transacciones, vouchers y canjes',
        'Integración con Stripe para gestión de suscripciones y pagos',
      ]} />
      <P>
        Fideliza+ se reserva el derecho de modificar, suspender o descontinuar cualquier
        funcionalidad del servicio con un preaviso razonable, excepto en casos de urgencia
        o incidencia de seguridad.
      </P>

      <H2 id="cuentas">2. Registro y cuentas</H2>
      <H3>2.1 Requisitos</H3>
      <UL items={[
        'Debes ser mayor de 18 años o tener capacidad legal para contratar en tu jurisdicción',
        'Debes proporcionar información veraz, actual y completa durante el registro',
        'Solo se permite una cuenta por negocio. Para múltiples negocios se requieren cuentas separadas',
        'Eres responsable de mantener la confidencialidad de tus credenciales de acceso',
      ]} />

      <H3>2.2 Subdominio</H3>
      <P>
        Al registrarte, recibes un subdominio único bajo el dominio fideliza.app
        (ej. <Highlight>tu-negocio.fideliza.app</Highlight>). Este subdominio:
      </P>
      <UL items={[
        'No puede transferirse a terceros',
        'No puede usarse para actividades distintas a las descritas en estos Términos',
        'Puede ser reclamado por Fideliza+ si viola estos Términos o está inactivo por más de 12 meses consecutivos',
      ]} />

      <H3>2.3 Seguridad de la cuenta</H3>
      <P>
        Eres el único responsable de todas las actividades que ocurran bajo tu cuenta.
        Debes notificar inmediatamente a <Highlight>support@fideliza.app</Highlight> ante
        cualquier uso no autorizado o sospecha de compromiso de tu cuenta.
      </P>

      <H2 id="planes">3. Planes, precios y facturación</H2>

      <H3>3.1 Planes disponibles</H3>
      <P>Fideliza+ ofrece los siguientes planes:</P>
      <UL items={[
        'Plan Gratis: hasta 50 clientes, 1 programa (tipos: Puntos y Sellos), historial limitado a las últimas 50 transacciones. Sin costo. Sin tarjeta de crédito requerida.',
        'Plan Starter: hasta 500 clientes, hasta 3 programas (tipos: Puntos, Sellos y Visitas), historial ilimitado, catálogo de recompensas.',
        'Plan Pro: clientes ilimitados, programas ilimitados, todos los tipos de programa (incluyendo Cashback), exportación CSV, soporte prioritario.',
      ]} />

      <H3>3.2 Facturación</H3>
      <UL items={[
        'Los planes de pago se facturan de forma recurrente (mensual o anual, según lo seleccionado) mediante Stripe',
        'Los precios están sujetos a los impuestos aplicables en tu jurisdicción',
        'Al proporcionar un método de pago, autorizas a Fideliza+ (a través de Stripe) a cargar el importe correspondiente en las fechas de renovación',
        'Los precios pueden actualizarse con un preaviso de 30 días por correo electrónico',
      ]} />

      <H3>3.3 Impagos y suspensión</H3>
      <P>
        Si un pago falla o la suscripción se cancela, tu cuenta se degradará
        automáticamente al <Highlight>Plan Gratis</Highlight> con sus limitaciones
        correspondientes. Tus datos se conservarán durante 90 días adicionales para que
        puedas reactivar el servicio. Transcurrido ese período sin regularización, Fideliza+
        podrá eliminar los datos asociados a las funcionalidades del plan de pago.
      </P>

      <H3>3.4 Cancelación y reembolsos</H3>
      <UL items={[
        'Puedes cancelar tu suscripción en cualquier momento desde la sección de Facturación en Configuración',
        'La cancelación no genera reembolso por el período ya pagado. El acceso al plan continuará hasta el final del período facturado',
        'No ofrecemos reembolsos prorrateados por cancelaciones anticipadas, salvo obligación legal o error de facturación por nuestra parte',
      ]} />

      <H2 id="uso-aceptable">4. Uso aceptable</H2>
      <P>
        Al usar Fideliza+, te comprometes a no realizar ninguna de las siguientes
        actividades:
      </P>
      <UL items={[
        'Usar el servicio para fines ilegales, fraudulentos o engañosos',
        'Registrar clientes finales sin su consentimiento o sin una base legítima para el tratamiento de sus datos',
        'Intentar acceder a cuentas, datos o subdominios de otros negocios',
        'Realizar ingeniería inversa, descompilar o intentar extraer el código fuente de la plataforma',
        'Sobrecargar deliberadamente la infraestructura del servicio (ataques de denegación de servicio o similares)',
        'Usar cuentas múltiples para eludir los límites del plan',
        'Revender, sublicenciar o comercializar el acceso al servicio a terceros sin autorización expresa',
        'Almacenar o procesar datos especialmente sensibles (datos de salud, documentos de identidad, datos financieros más allá de lo que el servicio permite explícitamente)',
      ]} />
      <P>
        Fideliza+ se reserva el derecho de suspender o eliminar cuentas que infrinjan estas
        normas sin previo aviso y sin derecho a reembolso.
      </P>

      <H2 id="datos-clientes">5. Datos de clientes finales y responsabilidad</H2>
      <P>
        En lo que respecta a los datos de tus clientes finales que ingresas en Fideliza+:
      </P>
      <UL items={[
        'Eres el responsable del tratamiento de dichos datos conforme al RGPD y la normativa aplicable',
        'Eres responsable de obtener las bases legales necesarias para registrar y tratar los datos de tus clientes (ej. consentimiento explícito, interés legítimo)',
        'Debes informar a tus clientes sobre el uso de sus datos de acuerdo con tu propia política de privacidad',
        'Fideliza+ actúa exclusivamente como encargado del tratamiento bajo tus instrucciones',
        'No debes registrar datos de menores de 16 años sin el consentimiento de sus tutores legales',
      ]} />
      <Warning>
        El historial de transacciones es <strong>inmutable por diseño del sistema</strong>.
        Esto significa que las transacciones registradas no pueden eliminarse individualmente
        una vez creadas, aunque sí puedes realizar ajustes de balance. Si necesitas corregir
        un error, usa el tipo de transacción "Ajuste". Al eliminar completamente tu cuenta,
        todos los datos asociados serán eliminados.
      </Warning>

      <H2 id="propiedad-intelectual">6. Propiedad intelectual</H2>
      <H3>6.1 Propiedad de Fideliza+</H3>
      <P>
        Todo el software, diseño, código fuente, marcas, logotipos y contenido de la
        plataforma son propiedad exclusiva de Fideliza+ y están protegidos por las leyes
        de propiedad intelectual aplicables. No te concedemos ningún derecho sobre ellos
        más allá del acceso al servicio descrito en estos Términos.
      </P>

      <H3>6.2 Tus datos y contenido</H3>
      <P>
        Los datos que ingresas en Fideliza+ (información de clientes, configuración del
        negocio, transacciones) te pertenecen. Nos otorgas una licencia limitada,
        no exclusiva y revocable para almacenar y procesar dichos datos exclusivamente con
        el fin de prestar el servicio.
      </P>

      <H2 id="disponibilidad">7. Disponibilidad del servicio</H2>
      <P>
        Nos esforzamos por mantener el servicio disponible de forma continua, pero no
        garantizamos un tiempo de actividad específico. En particular:
      </P>
      <UL items={[
        'El Plan Gratis no incluye ningún Acuerdo de Nivel de Servicio (SLA)',
        'Los planes de pago incluyen acceso prioritario al soporte pero no garantizan tiempos de resolución específicos en la versión actual del servicio',
        'Fideliza+ puede realizar mantenimientos programados con previo aviso',
        'No somos responsables por interrupciones causadas por terceros (Supabase, Stripe, proveedores de red)',
      ]} />

      <H2 id="limitacion">8. Limitación de responsabilidad</H2>
      <P>
        En la máxima medida permitida por la ley aplicable:
      </P>
      <UL items={[
        'El servicio se presta "tal cual" y "según disponibilidad", sin garantías de ningún tipo, expresas o implícitas',
        'Fideliza+ no será responsable por pérdidas de datos, lucro cesante, daño a la reputación, ni por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de uso del servicio',
        'La responsabilidad total máxima de Fideliza+ hacia ti por cualquier causa no superará el importe total que hayas pagado a Fideliza+ durante los 12 meses anteriores al evento que origina la reclamación, o 100 USD si no has realizado ningún pago',
      ]} />

      <H2 id="indemnizacion">9. Indemnización</H2>
      <P>
        Aceptas indemnizar y mantener indemne a Fideliza+ y a sus empleados, directores y
        colaboradores frente a cualquier reclamación, daño, pérdida o gasto (incluidos
        honorarios legales razonables) derivados de: (a) tu uso del servicio en
        incumplimiento de estos Términos; (b) los datos que ingresas en la plataforma;
        (c) cualquier incumplimiento de la normativa de protección de datos aplicable por
        tu parte como responsable del tratamiento de los datos de tus clientes.
      </P>

      <H2 id="terminacion">10. Terminación</H2>

      <H3>10.1 Por tu parte</H3>
      <P>
        Puedes cancelar tu cuenta en cualquier momento desde la configuración de tu cuenta
        o enviando un correo a <Highlight>support@fideliza.app</Highlight>. La cancelación
        no genera reembolso por el período ya pagado.
      </P>

      <H3>10.2 Por parte de Fideliza+</H3>
      <P>
        Fideliza+ puede suspender o cancelar tu acceso si: (a) incumples estos Términos;
        (b) tu cuenta presenta actividad fraudulenta o sospechosa; (c) el pago está
        pendiente por más de 30 días. Ante infracciones graves, la cancelación puede ser
        inmediata sin previo aviso.
      </P>

      <H3>10.3 Efectos de la terminación</H3>
      <P>
        Tras la cancelación de la cuenta, tendrás 30 días para exportar tus datos antes de
        su eliminación definitiva (plan Gratis) o 90 días (planes de pago). Una vez
        eliminados, los datos no son recuperables.
      </P>

      <H2 id="ley-aplicable">11. Ley aplicable y resolución de disputas</H2>
      <P>
        Estos Términos se rigen por la ley aplicable en la jurisdicción de operación de
        Fideliza+. Ante cualquier disputa, las partes se comprometen a intentar resolverla
        de forma amistosa en un plazo de 30 días. Si no se alcanza un acuerdo, la disputa
        se someterá a los tribunales competentes de dicha jurisdicción.
      </P>
      <P>
        Si eres consumidor en la Unión Europea, también puedes acceder a la plataforma
        europea de resolución de litigios en línea en{' '}
        <Highlight>https://ec.europa.eu/consumers/odr</Highlight>.
      </P>

      <H2 id="modificaciones">12. Modificaciones de los términos</H2>
      <P>
        Fideliza+ puede actualizar estos Términos en cualquier momento. Te notificaremos
        cambios materiales por correo electrónico y/o mediante un aviso en la plataforma
        con al menos <Highlight>15 días de antelación</Highlight>. El uso continuado del
        servicio tras la fecha de vigencia de los nuevos Términos implica su aceptación.
        Si no estás de acuerdo con los cambios, puedes cancelar tu cuenta antes de la
        fecha de entrada en vigor.
      </P>

      <H2 id="contacto">13. Contacto</H2>
      <P>
        Para cualquier consulta sobre estos Términos:
      </P>
      <P>
        <Highlight>Fideliza+</Highlight><br />
        Correo: <Highlight>support@fideliza.app</Highlight><br />
        Privacidad: <Highlight>privacy@fideliza.app</Highlight>
      </P>
    </>
  );
}

function TermsEn() {
  return (
    <>
      <P>
        <Highlight>Effective date: May 5, 2026.</Highlight>{' '}
        These Terms of Service ("Terms") govern access to and use of the Fideliza+ platform
        operated by Fideliza+ ("<Highlight>Fideliza+</Highlight>", "we", "us" or "our").
        By registering or using the service, you agree to these Terms in full. If you
        disagree, do not use the service.
      </P>

      <H2 id="descripcion">1. Description of service</H2>
      <P>
        Fideliza+ is a software-as-a-service (SaaS) platform that enables businesses to
        create, manage and operate customer loyalty programs. The service includes:
      </P>
      <UL items={[
        'Web admin dashboard to manage customers, programs and rewards',
        'Customer-facing web portal, accessible via unique access code (no password required)',
        'Dedicated subdomain per business (e.g. your-business.fideliza.app)',
        'Program types: points, stamps, visits and cashback (availability depends on plan)',
        'Transaction, voucher and redemption management',
        'Stripe integration for subscription and payment management',
      ]} />
      <P>
        Fideliza+ reserves the right to modify, suspend or discontinue any feature of the
        service with reasonable prior notice, except in cases of emergency or security
        incidents.
      </P>

      <H2 id="cuentas">2. Registration and accounts</H2>
      <H3>2.1 Requirements</H3>
      <UL items={[
        'You must be at least 18 years old or have legal capacity to contract in your jurisdiction',
        'You must provide truthful, current and complete information during registration',
        'Only one account per business is allowed. Separate accounts are required for multiple businesses',
        'You are responsible for maintaining the confidentiality of your login credentials',
      ]} />

      <H3>2.2 Subdomain</H3>
      <P>
        Upon registration, you receive a unique subdomain under the fideliza.app domain
        (e.g. <Highlight>your-business.fideliza.app</Highlight>). This subdomain:
      </P>
      <UL items={[
        'Cannot be transferred to third parties',
        'Cannot be used for activities other than those described in these Terms',
        'May be reclaimed by Fideliza+ if it violates these Terms or has been inactive for more than 12 consecutive months',
      ]} />

      <H3>2.3 Account security</H3>
      <P>
        You are solely responsible for all activities that occur under your account. You
        must immediately notify <Highlight>support@fideliza.app</Highlight> of any
        unauthorized use or suspected compromise of your account.
      </P>

      <H2 id="planes">3. Plans, pricing and billing</H2>

      <H3>3.1 Available plans</H3>
      <P>Fideliza+ offers the following plans:</P>
      <UL items={[
        'Free plan: up to 50 customers, 1 program (types: Points and Stamps), history limited to the last 50 transactions. No cost. No credit card required.',
        'Starter plan: up to 500 customers, up to 3 programs (types: Points, Stamps and Visits), unlimited history, reward catalog.',
        'Pro plan: unlimited customers, unlimited programs, all program types (including Cashback), CSV export, priority support.',
      ]} />

      <H3>3.2 Billing</H3>
      <UL items={[
        'Paid plans are billed on a recurring basis (monthly or annual, as selected) via Stripe',
        'Prices are subject to applicable taxes in your jurisdiction',
        'By providing a payment method, you authorize Fideliza+ (through Stripe) to charge the corresponding amount on renewal dates',
        'Prices may be updated with 30 days\' prior notice by email',
      ]} />

      <H3>3.3 Non-payment and suspension</H3>
      <P>
        If a payment fails or the subscription is cancelled, your account will automatically
        be downgraded to the <Highlight>Free Plan</Highlight> with its corresponding
        limitations. Your data will be retained for an additional 90 days so you can
        reactivate the service. After that period without resolution, Fideliza+ may delete
        data associated with paid-plan features.
      </P>

      <H3>3.4 Cancellation and refunds</H3>
      <UL items={[
        'You may cancel your subscription at any time from the Billing section in Settings',
        'Cancellation does not entitle you to a refund for the period already paid. Access to the plan continues until the end of the billed period',
        'We do not offer prorated refunds for early cancellations, except where required by law or in case of billing error on our part',
      ]} />

      <H2 id="uso-aceptable">4. Acceptable use</H2>
      <P>
        By using Fideliza+, you agree not to engage in any of the following activities:
      </P>
      <UL items={[
        'Using the service for illegal, fraudulent or deceptive purposes',
        'Registering end customers without their consent or without a lawful basis for processing their data',
        'Attempting to access accounts, data or subdomains of other businesses',
        'Reverse engineering, decompiling or attempting to extract source code from the platform',
        'Deliberately overloading the service infrastructure (denial-of-service attacks or similar)',
        'Using multiple accounts to circumvent plan limits',
        'Reselling, sublicensing or commercializing access to the service to third parties without express authorization',
        'Storing or processing specially sensitive data (health records, identity documents, financial data beyond what the service explicitly supports)',
      ]} />
      <P>
        Fideliza+ reserves the right to suspend or delete accounts that violate these rules
        without prior notice and without entitlement to a refund.
      </P>

      <H2 id="datos-clientes">5. End-customer data and responsibility</H2>
      <P>
        Regarding your end customers' data that you enter into Fideliza+:
      </P>
      <UL items={[
        'You are the data controller for such data under GDPR and applicable law',
        'You are responsible for obtaining the necessary legal bases to register and process your customers\' data (e.g. explicit consent, legitimate interest)',
        'You must inform your customers about the use of their data in accordance with your own privacy policy',
        'Fideliza+ acts solely as data processor under your instructions',
        'You must not register data of children under 16 without the consent of their legal guardians',
      ]} />
      <Warning>
        The transaction history is <strong>immutable by system design</strong>. This means
        individual transactions cannot be deleted once created, though you can make balance
        adjustments. If you need to correct an error, use the "Adjustment" transaction type.
        Upon full account deletion, all associated data will be permanently removed.
      </Warning>

      <H2 id="propiedad-intelectual">6. Intellectual property</H2>
      <H3>6.1 Fideliza+ property</H3>
      <P>
        All software, design, source code, trademarks, logos and content of the platform
        are the exclusive property of Fideliza+ and are protected by applicable intellectual
        property laws. We grant you no rights thereto beyond access to the service described
        in these Terms.
      </P>

      <H3>6.2 Your data and content</H3>
      <P>
        The data you enter into Fideliza+ (customer information, business configuration,
        transactions) belongs to you. You grant us a limited, non-exclusive and revocable
        license to store and process such data solely for the purpose of providing the
        service.
      </P>

      <H2 id="disponibilidad">7. Service availability</H2>
      <P>
        We strive to keep the service continuously available, but we do not guarantee a
        specific uptime. In particular:
      </P>
      <UL items={[
        'The Free Plan does not include any Service Level Agreement (SLA)',
        'Paid plans include priority support access but do not guarantee specific resolution times in the current version of the service',
        'Fideliza+ may perform scheduled maintenance with prior notice',
        'We are not responsible for interruptions caused by third parties (Supabase, Stripe, network providers)',
      ]} />

      <H2 id="limitacion">8. Limitation of liability</H2>
      <P>
        To the maximum extent permitted by applicable law:
      </P>
      <UL items={[
        'The service is provided "as is" and "as available", without warranties of any kind, express or implied',
        'Fideliza+ will not be liable for data loss, lost profits, reputational damage, or any indirect, incidental, special or consequential damages arising from the use or inability to use the service',
        'Fideliza\'s total maximum liability to you for any cause shall not exceed the total amount you have paid to Fideliza+ during the 12 months preceding the event giving rise to the claim, or USD 100 if you have made no payments',
      ]} />

      <H2 id="indemnizacion">9. Indemnification</H2>
      <P>
        You agree to indemnify and hold harmless Fideliza+ and its employees, directors and
        collaborators against any claims, damages, losses or expenses (including reasonable
        legal fees) arising from: (a) your use of the service in breach of these Terms;
        (b) the data you enter into the platform; (c) any breach of applicable data
        protection law by you as data controller for your customers' data.
      </P>

      <H2 id="terminacion">10. Termination</H2>

      <H3>10.1 By you</H3>
      <P>
        You may cancel your account at any time from your account settings or by emailing{' '}
        <Highlight>support@fideliza.app</Highlight>. Cancellation does not entitle you to
        a refund for the period already paid.
      </P>

      <H3>10.2 By Fideliza+</H3>
      <P>
        Fideliza+ may suspend or cancel your access if: (a) you breach these Terms;
        (b) your account shows fraudulent or suspicious activity; (c) payment is outstanding
        for more than 30 days. For serious violations, cancellation may be immediate without
        prior notice.
      </P>

      <H3>10.3 Effects of termination</H3>
      <P>
        After account cancellation, you will have 30 days (Free plan) or 90 days (paid
        plans) to export your data before permanent deletion. Once deleted, data cannot be
        recovered.
      </P>

      <H2 id="ley-aplicable">11. Governing law and dispute resolution</H2>
      <P>
        These Terms are governed by the applicable law in Fideliza+'s operating jurisdiction.
        In the event of any dispute, the parties commit to attempting amicable resolution
        within 30 days. If no agreement is reached, the dispute shall be submitted to the
        competent courts of that jurisdiction.
      </P>
      <P>
        If you are a consumer in the European Union, you may also access the EU online
        dispute resolution platform at{' '}
        <Highlight>https://ec.europa.eu/consumers/odr</Highlight>.
      </P>

      <H2 id="modificaciones">12. Changes to terms</H2>
      <P>
        Fideliza+ may update these Terms at any time. We will notify you of material changes
        by email and/or via a notice on the platform at least{' '}
        <Highlight>15 days in advance</Highlight>. Continued use of the service after the
        new Terms take effect constitutes your acceptance. If you disagree with the changes,
        you may cancel your account before the effective date.
      </P>

      <H2 id="contacto">13. Contact</H2>
      <P>
        For any questions regarding these Terms:
      </P>
      <P>
        <Highlight>Fideliza+</Highlight><br />
        Email: <Highlight>support@fideliza.app</Highlight><br />
        Privacy: <Highlight>privacy@fideliza.app</Highlight>
      </P>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default async function TermsPage({ params }: Props) {
  const { lang } = await params;
  if (!isValidLocale(lang)) notFound();

  const isEs = (lang as Locale) === 'es';
  const title = isEs ? 'Términos de Servicio' : 'Terms of Service';
  const updated = isEs ? 'Última actualización: 5 de mayo de 2026' : 'Last updated: May 5, 2026';
  const backLabel = isEs ? 'Volver al inicio' : 'Back to home';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-white/10">
        <Container className="flex items-center justify-between h-14">
          <a href="/" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5 text-white" aria-hidden="true">
                <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z" fill="currentColor" opacity="0.9" />
                <path d="M9 12l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-white text-base tracking-tight">
              Fideliza<span className="text-indigo-400">+</span>
            </span>
          </a>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 rounded-md bg-white/5 border border-white/10 p-0.5">
              <a href={`/es/terms`} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${isEs ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>ES</a>
              <a href={`/en/terms`} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${!isEs ? 'bg-indigo-500 text-white' : 'text-gray-400 hover:text-white'}`}>EN</a>
            </div>
            <a href={`/${lang}`} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              {backLabel}
            </a>
          </div>
        </Container>
      </header>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-indigo-950/40 to-gray-950 border-b border-white/10">
        <Container className="py-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">{title}</h1>
          <p className="text-gray-500 text-sm">{updated}</p>
        </Container>
      </div>

      {/* ── Content ── */}
      <Container className="py-10 max-w-3xl">
        {isEs ? <TermsEs /> : <TermsEn />}

        <div className="pt-10 pb-4 text-center text-xs text-gray-600 border-t border-white/5 mt-10">
          Fideliza+ · {isEs ? 'Términos de Servicio' : 'Terms of Service'} ·{' '}
          <a href={`/${lang}/privacy`} className="hover:text-gray-400 transition-colors">
            {isEs ? 'Política de privacidad' : 'Privacy policy'}
          </a>
        </div>
      </Container>
    </div>
  );
}
