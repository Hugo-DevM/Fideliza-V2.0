'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
function Brand() {
  return <strong className="text-indigo-400 font-bold">Fideliza</strong>;
}

/* ─── Content ───────────────────────────────────────────────────────────── */

function PrivacyEs() {
  return (
    <>
      <P>
        <Highlight>Fecha de entrada en vigor: 19 de junio de 2026.</Highlight>{' '}
        Esta Política de Privacidad describe cómo <Brand /> (“<Brand />”,
        “nosotros” o “nuestro”) recopila, usa, almacena y protege la información personal
        de quienes usan nuestra plataforma. Al acceder o usar los servicios de <Brand />,
        aceptas las prácticas descritas en este documento.
      </P>
      <P>
        <Brand /> opera como una plataforma SaaS de fidelización multi-tenant. Existen dos
        tipos de usuarios: los <Highlight>negocios</Highlight> que administran sus programas
        de lealtad (usuarios administradores) y los <Highlight>clientes finales</Highlight>{' '}
        de esos negocios. Esta política cubre ambos casos.
      </P>

      <H2 id="responsable">1. Responsable del tratamiento</H2>
      <P>
        <Brand /> actúa como <Highlight>responsable del tratamiento</Highlight> respecto a
        los datos de los usuarios administradores (negocios). Respecto a los datos de los
        clientes finales ingresados por los negocios, <Brand /> actúa como{' '}
        <Highlight>encargado del tratamiento</Highlight> bajo las instrucciones del negocio
        correspondiente, que es el responsable.
      </P>
      <P>
        Para consultas sobre privacidad, puedes contactarnos en:{' '}
        <Highlight>privacy@fideliza.app</Highlight>
      </P>

      <H2 id="datos-recopilados">2. Datos que recopilamos</H2>

      <H3>2.1 Datos de usuarios administradores (negocios)</H3>
      <P>Al registrar un negocio en <Brand />, recopilamos:</P>
      <UL items={[
        'Nombre completo del usuario registrante',
        'Dirección de correo electrónico',
        'Contraseña (almacenada de forma cifrada mediante Supabase Auth — nunca en texto plano)',
        'Nombre del negocio y subdominio elegido (ej. tu-negocio.fideliza.app)',
        'Información de facturación gestionada por Stripe (no almacenamos datos de tarjetas de crédito)',
        'Configuración de la cuenta: colores, mensaje de bienvenida, etiquetas personalizadas, URL de términos',
      ]} />

      <H3>2.2 Datos de clientes finales (ingresados por el negocio)</H3>
      <P>
        Los negocios registran a sus clientes en la plataforma. <Brand /> almacena la
        siguiente información por instrucción del negocio:
      </P>
      <UL items={[
        'Nombre del cliente final',
        'Número de teléfono (opcional)',
        'Preferencia de opt-in para notificaciones de WhatsApp (cuando el negocio habilita esta función)',
        'Notas internas sobre el cliente (opcional, visibles solo para el negocio)',
        'Código de acceso único generado automáticamente (alfanumérico, sin relación con datos personales)',
        'Balance de puntos, sellos y visitas por programa',
        'Historial completo de transacciones (inmutable por diseño)',
        'Vouchers emitidos y su estado (pendiente, canjeado, expirado)',
      ]} />
      <P>
        Los clientes finales <Highlight>no crean una cuenta</Highlight> en <Brand /> ni
        proporcionan su correo electrónico a la plataforma. Su acceso es mediante un código
        alfanumérico gestionado por el negocio.
      </P>

      <H3>2.3 Datos técnicos y de uso</H3>
      <UL items={[
        'Dirección IP de las solicitudes entrantes (usada para limitación de velocidad y registros de auditoría de seguridad)',
        'Marca de tiempo de cada operación',
        'Tipo y versión del navegador (logs estándar del servidor)',
        'Eventos de auditoría internos (inicio de sesión, cambios de configuración, operaciones sensibles)',
      ]} />

      <H2 id="uso-datos">3. Cómo usamos tus datos</H2>
      <P>Usamos la información recopilada para los siguientes fines:</P>
      <UL items={[
        'Prestar el servicio: gestionar cuentas, programas de fidelización, transacciones de puntos y canjes',
        'Autenticación y seguridad: verificar identidades, prevenir accesos no autorizados y mantener registros de auditoría',
        'Facturación: procesar pagos y gestionar suscripciones a través de Stripe',
        'Comunicaciones: enviar confirmaciones de transacciones, notificaciones de cuenta y actualizaciones del servicio al correo del administrador',
        'Mejora del servicio: análisis agregados y anónimos del uso de la plataforma para mejorar funcionalidades',
        'Cumplimiento legal: responder a obligaciones legales, órdenes judiciales o requerimientos regulatorios',
      ]} />
      <P>
        <Highlight>No vendemos, arrendamos ni compartimos</Highlight> datos personales con
        terceros con fines publicitarios o comerciales ajenos a la prestación del servicio.
      </P>

      <H2 id="terceros">4. Terceros que procesan datos</H2>
      <P>
        Para operar el servicio, compartimos datos necesarios con los siguientes
        subencargados del tratamiento:
      </P>
      <UL items={[
        'Supabase (supabase.com) — base de datos PostgreSQL, autenticación y almacenamiento. Actúa como subencargado bajo un Acuerdo de Procesamiento de Datos (DPA). Los datos pueden almacenarse en servidores en la UE o EE.UU. según la configuración de la instancia.',
        'Stripe (stripe.com) — procesamiento de pagos y gestión de suscripciones. Stripe es responsable independiente respecto a los datos de pago bajo su propia política de privacidad. No almacenamos datos de tarjetas de crédito.',
        'Meta Platforms Ireland Ltd. (facebook.com) — utilizamos el Meta Pixel para medir el rendimiento de nuestras campañas publicitarias. El Pixel puede establecer cookies de seguimiento (_fbp, _fbc) en tu navegador para identificar visitas y conversiones. Este tratamiento solo se realiza si has otorgado tu consentimiento a través del aviso de cookies. Meta actúa como responsable independiente para sus propias finalidades publicitarias conforme a su Política de datos.',
        'Meta Platforms Ireland Ltd. (WhatsApp Business API) — cuando el negocio tiene habilitadas las notificaciones de WhatsApp, utilizamos la API de WhatsApp Business para enviar mensajes a los clientes finales que han dado su consentimiento explícito (opt-in). Los mensajes pueden incluir bienvenida, saldo de puntos, alertas de racha y promociones del negocio. El cliente puede revocar su consentimiento en cualquier momento solicitándolo al negocio. Meta procesa el número de teléfono y el contenido del mensaje conforme a su Política de Privacidad y sus Políticas de Uso de WhatsApp Business.',
        'Proveedores de infraestructura de hosting — para alojar la aplicación web. Los datos se transmiten cifrados (TLS 1.2+).',
      ]} />

      <H2 id="retencion">5. Retención de datos</H2>
      <UL items={[
        'Datos de la cuenta del negocio: mientras la cuenta esté activa. Tras la eliminación de la cuenta, se conservan durante 30 días antes de ser eliminados definitivamente, salvo obligación legal de retención mayor.',
        'Historial de transacciones: inmutable por diseño del sistema para garantizar integridad. Se elimina al eliminarse la cuenta del negocio.',
        'Datos de clientes finales: permanecen activos mientras el negocio administrador mantenga su cuenta. El negocio puede desactivar o gestionar a sus clientes en cualquier momento.',
        'Registros de auditoría y seguridad: hasta 12 meses desde su creación.',
        'Datos de facturación: de acuerdo con las obligaciones fiscales y contables aplicables (generalmente 5-7 años).',
      ]} />

      <H2 id="seguridad">6. Seguridad</H2>
      <P>Implementamos medidas técnicas y organizativas para proteger los datos:</P>
      <UL items={[
        'Cifrado en tránsito: TLS/HTTPS en todas las comunicaciones',
        'Contraseñas: cifradas mediante algoritmos de hashing seguros gestionados por Supabase Auth (nunca almacenadas en texto plano)',
        'Aislamiento de datos: cada negocio opera en un subdominio propio con políticas de seguridad a nivel de fila (Row Level Security) en la base de datos — es imposible acceder a datos de otro negocio',
        'Políticas de seguridad HTTP: CSP, HSTS, X-Frame-Options, X-Content-Type-Options aplicadas a nivel de servidor',
        'Códigos de canje: generados mediante bytes aleatorios criptográficamente seguros',
        'Registro de auditoría: todas las operaciones sensibles quedan registradas con marca de tiempo e IP de origen',
        'Redacción de PII en logs: los datos personales (emails, teléfonos, códigos) se redactan en los registros del sistema antes de su escritura',
      ]} />
      <P>
        A pesar de estas medidas, ningún sistema es completamente invulnerable. En caso de
        una brecha de seguridad que afecte a tus datos, te notificaremos conforme a los
        plazos exigidos por la normativa aplicable.
      </P>

      <H2 id="derechos">7. Tus derechos</H2>
      <P>
        Según la normativa aplicable (incluyendo el RGPD para usuarios en el Espacio
        Económico Europeo y la CCPA para residentes en California), tienes los siguientes
        derechos:
      </P>
      <UL items={[
        'Acceso: solicitar una copia de los datos personales que tenemos sobre ti',
        'Rectificación: corregir datos incorrectos o incompletos',
        'Supresión ("derecho al olvido"): solicitar la eliminación de tus datos personales, sujeto a las excepciones legales aplicables',
        'Portabilidad: recibir tus datos en un formato estructurado y legible por máquina',
        'Oposición y limitación: oponerte al tratamiento o solicitar su limitación en determinadas circunstancias',
        'Retirada del consentimiento: cuando el tratamiento se base en el consentimiento, puedes retirarlo en cualquier momento sin que ello afecte a la licitud del tratamiento anterior',
        'Reclamación: presentar una reclamación ante la autoridad de control competente de tu país',
      ]} />
      <P>
        Para ejercer cualquiera de estos derechos, escríbenos a{' '}
        <Highlight>privacy@fideliza.app</Highlight>. Responderemos en un plazo máximo de
        30 días.
      </P>
      <P>
        <Highlight>Nota para clientes finales de negocios:</Highlight> si eres el cliente
        de un negocio que usa <Brand /> y quieres ejercer tus derechos sobre los datos que
        ese negocio tiene registrados sobre ti, debes dirigirte directamente al negocio
        (responsable del tratamiento). <Brand /> actuará siguiendo sus instrucciones.
      </P>

      <H2 id="cookies">8. Cookies y tecnologías de seguimiento</H2>
      <H3>8.1 Cookies estrictamente necesarias</H3>
      <P>
        Usamos cookies de sesión generadas por Supabase Auth para mantener iniciada la
        sesión de los usuarios administradores. Estas cookies son esenciales para el
        funcionamiento del servicio y no requieren consentimiento previo.
      </P>
      <H3>8.2 Cookies de publicidad y medición (requieren consentimiento)</H3>
      <P>
        Si aceptas las cookies opcionales a través del aviso que aparece al visitar
        nuestra web, instalamos el <Highlight>Meta Pixel</Highlight> (de Meta Platforms
        Ireland Ltd.), que puede establecer las siguientes cookies en tu navegador:
      </P>
      <UL items={[
        '_fbp — identificador único de navegador generado por Meta, con una vigencia de 90 días. Se usa para medir la efectividad de la publicidad y atribuir conversiones.',
        '_fbc — almacena el parámetro fbclid presente en la URL cuando llegas desde un anuncio de Meta. Vigencia: 90 días.',
      ]} />
      <P>
        Estos datos permiten a Meta atribuir visitas y acciones en nuestra web a las
        campañas publicitarias que ejecutamos en Facebook e Instagram. Meta actúa como
        responsable independiente de este tratamiento.{' '}
        <Highlight>Si rechazas las cookies opcionales, el Meta Pixel no se cargará</Highlight>{' '}
        y ninguna de estas cookies será instalada.
      </P>
      <P>
        Puedes retirar tu consentimiento en cualquier momento limpiando las cookies de
        tu navegador o recargando la página, donde el aviso volverá a aparecer.
      </P>
      <H3>8.3 Clientes finales</H3>
      <P>
        Los clientes finales que acceden al portal a través de su código de acceso{' '}
        <Highlight>no requieren cookies</Highlight> para usar la plataforma y no están
        sujetos al Meta Pixel.
      </P>

      <H2 id="menores">9. Menores de edad</H2>
      <P>
        <Brand /> está dirigida exclusivamente a negocios y profesionales. No recopilamos
        intencionalmente datos de menores de 16 años. Si tienes conocimiento de que un
        menor ha proporcionado datos personales sin consentimiento parental, contáctanos
        para eliminarlos.
      </P>

      <H2 id="transferencias">10. Transferencias internacionales</H2>
      <P>
        Los datos pueden almacenarse y procesarse en servidores ubicados fuera de tu país
        de residencia. Cuando transferimos datos desde el Espacio Económico Europeo, lo
        hacemos bajo mecanismos de transferencia adecuados (cláusulas contractuales tipo,
        decisiones de adecuación u otros mecanismos reconocidos por la normativa vigente).
      </P>

      <H2 id="cambios">11. Cambios en esta política</H2>
      <P>
        Podemos actualizar esta Política de Privacidad periódicamente. Te notificaremos
        cualquier cambio material por correo electrónico o mediante un aviso destacado en
        la plataforma al menos 15 días antes de su entrada en vigor. El uso continuado del
        servicio tras la fecha de vigencia implica tu aceptación de la versión actualizada.
      </P>

      <H2 id="contacto">12. Contacto</H2>
      <P>
        Para cualquier consulta, solicitud o reclamación relacionada con la privacidad de
        tus datos, puedes contactarnos en:
      </P>
      <P>
        <Brand /><br />
        Correo: <Highlight>privacy@fideliza.app</Highlight>
      </P>
    </>
  );
}

function PrivacyEn() {
  return (
    <>
      <P>
        <Highlight>Effective date: June 19, 2026.</Highlight>{' '}
        This Privacy Policy describes how <Brand /> (“<Brand />”,
        “we”, “us” or “our”) collects, uses, stores and protects personal information of
        those who use our platform. By accessing or using <Brand /> services, you agree to
        the practices described in this document.
      </P>
      <P>
        <Brand /> operates as a multi-tenant loyalty SaaS platform. There are two types of
        users: <Highlight>businesses</Highlight> that manage their loyalty programs (admin
        users) and the <Highlight>end customers</Highlight> of those businesses. This policy
        covers both cases.
      </P>

      <H2 id="responsable">1. Data controller</H2>
      <P>
        <Brand /> acts as <Highlight>data controller</Highlight> with respect to admin
        users’ (businesses’) data. With respect to end-customer data entered by businesses,
        <Brand /> acts as a <Highlight>data processor</Highlight> under the instructions of
        the respective business, which is the controller.
      </P>
      <P>
        For privacy inquiries, contact us at: <Highlight>privacy@fideliza.app</Highlight>
      </P>

      <H2 id="datos-recopilados">2. Data we collect</H2>

      <H3>2.1 Admin user data (businesses)</H3>
      <P>When registering a business on <Brand />, we collect:</P>
      <UL items={[
        'Full name of the registering user',
        'Email address',
        'Password (stored in encrypted form via Supabase Auth — never in plain text)',
        'Business name and chosen subdomain (e.g. your-business.fideliza.app)',
        'Billing information managed by Stripe (we do not store credit card data)',
        'Account settings: colors, welcome message, custom labels, terms URL',
      ]} />

      <H3>2.2 End-customer data (entered by the business)</H3>
      <P>
        Businesses register their customers on the platform. <Brand /> stores the following
        information at the business’s instruction:
      </P>
      <UL items={[
        'Customer name',
        'Phone number (optional)',
        'WhatsApp notification opt-in preference (when the business enables this feature)',
        'Internal notes about the customer (optional, visible to the business only)',
        'Automatically generated unique access code (alphanumeric, unrelated to personal data)',
        'Points, stamps and visits balance per program',
        'Full immutable transaction history',
        'Issued vouchers and their status (pending, redeemed, expired)',
      ]} />
      <P>
        End customers <Highlight>do not create an account</Highlight> on <Brand /> and do
        not provide their email address to the platform. Their access is via an alphanumeric
        code managed by the business.
      </P>

      <H3>2.3 Technical and usage data</H3>
      <UL items={[
        'IP address of incoming requests (used for rate limiting and security audit logs)',
        'Timestamp of each operation',
        'Browser type and version (standard server logs)',
        'Internal audit events (logins, configuration changes, sensitive operations)',
      ]} />

      <H2 id="uso-datos">3. How we use your data</H2>
      <P>We use collected information for the following purposes:</P>
      <UL items={[
        'Service delivery: managing accounts, loyalty programs, points transactions and redemptions',
        'Authentication and security: verifying identities, preventing unauthorized access and maintaining audit logs',
        'Billing: processing payments and managing subscriptions via Stripe',
        'Communications: sending transaction confirmations, account notifications and service updates to the admin\'s email',
        'Service improvement: aggregated and anonymized usage analysis to improve features',
        'Legal compliance: responding to legal obligations, court orders or regulatory requirements',
      ]} />
      <P>
        We <Highlight>do not sell, rent or share</Highlight> personal data with third
        parties for advertising or commercial purposes unrelated to service delivery.
      </P>

      <H2 id="terceros">4. Third parties that process data</H2>
      <P>
        To operate the service, we share necessary data with the following sub-processors:
      </P>
      <UL items={[
        'Supabase (supabase.com) — PostgreSQL database, authentication and storage. Acts as sub-processor under a Data Processing Agreement (DPA). Data may be stored on EU or US servers depending on the instance configuration.',
        'Stripe (stripe.com) — payment processing and subscription management. Stripe is an independent controller for payment data under its own privacy policy. We do not store credit card data.',
        'Meta Platforms Ireland Ltd. (facebook.com) — we use the Meta Pixel to measure the performance of our advertising campaigns. The Pixel may set tracking cookies (_fbp, _fbc) in your browser to identify visits and conversions. This processing only occurs if you have given your consent via the cookie notice. Meta acts as an independent controller for its own advertising purposes under its Data Policy.',
        'Meta Platforms Ireland Ltd. (WhatsApp Business API) — when a business enables WhatsApp notifications, we use the WhatsApp Business API to send messages to end customers who have given explicit consent (opt-in). Messages may include welcome, points balance, streak alerts and business promotions. Customers may revoke consent at any time by requesting it from the business. Meta processes the phone number and message content in accordance with its Privacy Policy and WhatsApp Business Terms.',
        'Hosting infrastructure providers — to host the web application. Data is transmitted encrypted (TLS 1.2+).',
      ]} />

      <H2 id="retencion">5. Data retention</H2>
      <UL items={[
        'Business account data: while the account is active. After account deletion, retained for 30 days before permanent deletion, unless a longer legal retention obligation applies.',
        'Transaction history: immutable by system design to ensure integrity. Deleted when the business account is deleted.',
        'End-customer data: remains active while the administering business maintains its account. The business can deactivate or manage their customers at any time.',
        'Audit and security logs: up to 12 months from creation.',
        'Billing data: in accordance with applicable tax and accounting obligations (generally 5–7 years).',
      ]} />

      <H2 id="seguridad">6. Security</H2>
      <P>We implement technical and organizational measures to protect data:</P>
      <UL items={[
        'Encryption in transit: TLS/HTTPS on all communications',
        'Passwords: hashed using secure algorithms managed by Supabase Auth (never stored in plain text)',
        'Data isolation: each business operates on its own subdomain with Row Level Security (RLS) policies at the database level — cross-tenant data access is architecturally impossible',
        'HTTP security policies: CSP, HSTS, X-Frame-Options, X-Content-Type-Options applied at server level',
        'Redemption codes: generated using cryptographically secure random bytes',
        'Audit log: all sensitive operations are recorded with timestamp and source IP',
        'PII redaction in logs: personal data (emails, phones, codes) is redacted in system logs before writing',
      ]} />
      <P>
        Despite these measures, no system is completely invulnerable. In the event of a
        security breach affecting your data, we will notify you within the timeframes
        required by applicable law.
      </P>

      <H2 id="derechos">7. Your rights</H2>
      <P>
        Under applicable law (including GDPR for users in the European Economic Area and
        CCPA for California residents), you have the following rights:
      </P>
      <UL items={[
        'Access: request a copy of the personal data we hold about you',
        'Rectification: correct inaccurate or incomplete data',
        'Erasure ("right to be forgotten"): request deletion of your personal data, subject to applicable legal exceptions',
        'Portability: receive your data in a structured, machine-readable format',
        'Objection and restriction: object to processing or request its restriction in certain circumstances',
        'Withdrawal of consent: where processing is based on consent, you may withdraw it at any time without affecting the lawfulness of prior processing',
        'Complaint: lodge a complaint with the supervisory authority in your country',
      ]} />
      <P>
        To exercise any of these rights, write to us at{' '}
        <Highlight>privacy@fideliza.app</Highlight>. We will respond within 30 days.
      </P>
      <P>
        <Highlight>Note for end customers of businesses:</Highlight> if you are a customer
        of a business that uses <Brand /> and wish to exercise your rights over the data
        that business has registered about you, you must contact the business directly
        (the data controller). <Brand /> will act on their instructions.
      </P>

      <H2 id="cookies">8. Cookies and tracking technologies</H2>
      <H3>8.1 Strictly necessary cookies</H3>
      <P>
        We use session cookies generated by Supabase Auth to keep admin users signed in.
        These cookies are essential for the service to function and do not require prior
        consent.
      </P>
      <H3>8.2 Advertising and measurement cookies (require consent)</H3>
      <P>
        If you accept optional cookies via the notice displayed when you visit our website,
        we load the <Highlight>Meta Pixel</Highlight> (by Meta Platforms Ireland Ltd.),
        which may set the following cookies in your browser:
      </P>
      <UL items={[
        '_fbp — a unique browser identifier generated by Meta, valid for 90 days. Used to measure advertising effectiveness and attribute conversions.',
        '_fbc — stores the fbclid parameter present in the URL when you arrive from a Meta ad. Valid for 90 days.',
      ]} />
      <P>
        These cookies allow Meta to attribute visits and actions on our website to the
        advertising campaigns we run on Facebook and Instagram. Meta acts as an independent
        controller for this processing.{' '}
        <Highlight>If you decline optional cookies, the Meta Pixel will not load</Highlight>{' '}
        and none of these cookies will be set.
      </P>
      <P>
        You may withdraw your consent at any time by clearing your browser cookies and
        reloading the page, where the notice will appear again.
      </P>
      <H3>8.3 End customers</H3>
      <P>
        End customers accessing the portal via their access code{' '}
        <Highlight>do not require cookies</Highlight> to use the platform and are not
        subject to the Meta Pixel.
      </P>

      <H2 id="menores">9. Children’s privacy</H2>
      <P>
        <Brand /> is intended exclusively for businesses and professionals. We do not
        intentionally collect data from children under 16. If you are aware that a minor
        has provided personal data without parental consent, contact us to have it removed.
      </P>

      <H2 id="transferencias">10. International transfers</H2>
      <P>
        Data may be stored and processed on servers located outside your country of
        residence. When we transfer data from the European Economic Area, we do so under
        appropriate transfer mechanisms (standard contractual clauses, adequacy decisions
        or other mechanisms recognized by applicable law).
      </P>

      <H2 id="cambios">11. Changes to this policy</H2>
      <P>
        We may update this Privacy Policy periodically. We will notify you of any material
        changes by email or via a prominent notice on the platform at least 15 days before
        they take effect. Continued use of the service after the effective date constitutes
        your acceptance of the updated version.
      </P>

      <H2 id="contacto">12. Contact</H2>
      <P>
        For any questions, requests or complaints related to the privacy of your data,
        contact us at:
      </P>
      <P>
        <Brand /><br />
        Email: <Highlight>privacy@fideliza.app</Highlight>
      </P>
    </>
  );
}

function subscribeNoop() {
  return () => {};
}
function getClientSnapshot() {
  return true;
}
function getServerSnapshot() {
  return false;
}

/* ─── Page shell ─────────────────────────────────────────────────────────── */

export default function PrivacyPage() {
  const [lang, setLang] = useState<'es' | 'en'>(() => {
    if (typeof window === 'undefined') return 'es';
    const saved = localStorage.getItem('landing-lang');
    return saved === 'en' || saved === 'es' ? saved : 'es';
  });
  // false during SSR and hydration render, true once mounted on the client
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot);

  function handleLangChange(newLang: 'es' | 'en') {
    setLang(newLang);
    localStorage.setItem('landing-lang', newLang);
  }

  if (!mounted) return null;

  const isEs = lang === 'es';
  const title = isEs ? 'Política de Privacidad' : 'Privacy Policy';
  const updated = isEs ? 'Última actualización: 19 de junio de 2026' : 'Last updated: June 19, 2026';
  const backLabel = isEs ? 'Volver al inicio' : 'Back to home';

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <ScrollReveal deps={[lang]} />

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-md border-b border-white/10">
        <Container className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            {backLabel}
          </Link>
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
            <Image src="/logofideliza.svg" alt="Fideliza" width={96} height={96} className="hidden sm:block h-24 w-auto opacity-80" />
          </div>
        </Container>
      </div>

      {/* ── Content ── */}
      <Container className="py-10 max-w-3xl">
        {isEs ? <PrivacyEs /> : <PrivacyEn />}

        <div className="pt-10 pb-4 text-center text-xs text-gray-600 border-t border-white/5 mt-10">
          <strong className="text-indigo-400 font-bold">Fideliza</strong> · {isEs ? 'Política de Privacidad' : 'Privacy Policy'} ·{' '}
          <a href="/terms" className="hover:text-gray-400 transition-colors">
            {isEs ? 'Términos de servicio' : 'Terms of service'}
          </a>
        </div>
      </Container>
    </div>
  );
}
