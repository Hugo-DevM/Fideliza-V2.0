import type { Dictionary } from "../index";

export const es: Dictionary = {
  navbar: {
    howItWorks: "Cómo funciona",
    features: "Funciones",
    pricing: "Precios",
    faq: "FAQ",
    signIn: "Iniciar sesión",
    cta: "Acceso anticipado",
    openMenu: "Abrir menú",
    closeMenu: "Cerrar menú",
    manual: "Manual",
  },

  hero: {
    badge: "Acceso anticipado disponible",
    headingPlain: "Programas de fidelización que ",
    headingGradient: "realmente se usan",
    body: "Dale a tus clientes una tarjeta de fidelización digital — sin descargar una app, sin crear una cuenta. Solo un código único. Tu negocio obtiene un subdominio propio y un panel completo para gestionar puntos, sellos y premios.",
    cta1: "Acceso anticipado — es gratis",
    cta2: "Ver cómo funciona",
    socialProofCount: "+40 negocios",
    socialProofText: "ya están en la lista de espera",
    card: {
      noAppBadge: "Sin app",
      pointsLabel: "Puntos Brew",
      lifetimeLabel: "Total",
      untilNextReward: "150 pts para el próximo premio",
      punchCardLabel: "Tarjeta de café — 7 de 10",
      accessCodeLabel: "Código de acceso",
    },
  },

  howItWorks: {
    label: "Simple por diseño",
    heading: "En marcha en minutos",
    body: "Sin configuraciones complejas. Sin capacitación. Fideliza está hecho para dueños de negocios, no para desarrolladores.",
    steps: [
      {
        title: "Regístrate y elige tu subdominio",
        description:
          "Crea tu cuenta en menos de 2 minutos. Tu negocio obtiene una URL propia como tutienda.fideliza.app — sin configuración técnica.",
      },
      {
        title: "Diseña tu programa de fidelización",
        description:
          "Elige tu mecánica de recompensas: puntos por compra, tarjeta de sellos o premios por visitas. Configura qué ganan los clientes y qué pueden canjear.",
      },
      {
        title: "Agrega clientes — reciben un código único",
        description:
          "Registra clientes desde tu panel. Cada cliente recibe un código de acceso personal — sin app, sin contraseña, sin fricción. Compártelo como código QR o tarjeta impresa.",
      },
      {
        title: "Los clientes ganan y canjean — al instante",
        description:
          "Escanea o ingresa el código en el punto de venta. Los puntos se agregan en tiempo real. Cuando los clientes canjean un premio, el personal verifica el cupón de un solo uso — sin app de ningún lado.",
      },
    ],
  },

  features: {
    label: "Qué incluye",
    heading: "Todo lo que necesita tu programa de fidelización",
    body: "Diseñado específicamente para pequeñas y medianas empresas que quieren retención real de clientes — sin la complejidad de una solución empresarial.",
    items: [
      {
        badge: "Multi-programa",
        badgeColor: "indigo" as const,
        title: "Puntos, sellos y visitas — tú decides",
        description:
          "Ejecuta varios programas de fidelización a la vez. Una tarjeta de café Y un programa de puntos en la misma cuenta. Cada programa tiene su propio saldo, premios y configuración.",
      },
      {
        badge: "Sin fricción",
        badgeColor: "green" as const,
        title: "Los clientes no necesitan nada — solo su código",
        description:
          "Sin app. Sin cuenta. Sin contraseña. Los clientes se identifican con un código de 8 caracteres que tú les das. Pueden ver su saldo en tutienda.fideliza.app en cualquier momento.",
      },
      {
        badge: "Multi-tenant",
        badgeColor: "indigo" as const,
        title: "Tu propio subdominio con tu marca",
        description:
          "Cada negocio en Fideliza obtiene un subdominio aislado como marios.fideliza.app. Tus datos, tus clientes, tu marca — completamente separados de los demás negocios.",
      },
      {
        badge: "Tiempo real",
        badgeColor: "amber" as const,
        title: "Saldo e historial de transacciones en vivo",
        description:
          "Cada punto ganado o canjeado se registra al instante. Libro de transacciones completo para tus registros. Ve qué premios generan más participación y quiénes son tus clientes más leales.",
      },
    ],
    visuals: {
      programTypes: {
        types: [
          { label: "Puntos", active: true },
          { label: "Sellos", active: false },
          { label: "Visitas", active: false },
        ],
        balance: "350 pts",
        nextReward: "Próximo premio: 150 pts",
      },
      accessCode: {
        status: "Activo",
        hint: "Sin registro — el código es todo lo que necesitan",
      },
      subdomain: {
        hint: "Datos aislados por cliente — sin mezcla entre negocios",
      },
      transaction: {
        rows: [
          { label: "Compra $28.00", points: "+280", type: "earn" as const },
          { label: "Compra $12.50", points: "+125", type: "earn" as const },
          {
            label: "Canje: Café Gratis",
            points: "−250",
            type: "redeem" as const,
          },
        ],
        balanceLabel: "Saldo",
      },
    },
  },

  benefits: {
    stats: [
      {
        stat: "0",
        unit: "Descargas de app",
        description:
          "Los clientes nunca visitan una tienda de apps. Los códigos de acceso funcionan desde cualquier navegador o tarjeta impresa.",
      },
      {
        stat: "< 5",
        unit: "Minutos para lanzar",
        description:
          "Regístrate, configura tu programa, agrega tu primer cliente. Eso es todo. No necesitas un departamento de IT.",
      },
      {
        stat: "100%",
        unit: "Datos aislados",
        description:
          "Tus clientes son tuyos. Sin mezcla de datos. Cada cuenta funciona en un entorno completamente aislado.",
      },
      {
        stat: "∞",
        unit: "Tipos de programa",
        description:
          "Ejecuta un programa de puntos y una tarjeta de sellos simultáneamente. Mecánicas distintas para distintos públicos.",
      },
    ],
    label: "Hecho para negocios",
    heading: "Más visitas repetidas, menos incertidumbre",
    body: "La fidelización no debería requerir un desarrollador, una app dedicada ni seis meses de implementación. Fideliza es la plataforma que los negocios independientes pueden usar y costear.",
    items: [
      {
        title: "Retén clientes, no solo atráelos",
        body: "Los programas de fidelización aumentan la frecuencia de visitas al dar a los clientes una razón tangible para volver. Rastrea quién es leal y prémialos antes de que se vayan.",
      },
      {
        title: "Conoce a tus mejores clientes",
        body: "Ve puntos acumulados, historial de visitas y patrones de canje para cada cliente. Tus habituales más leales son visibles de un vistazo — sin hojas de cálculo.",
      },
      {
        title: "El personal lo usa en segundos",
        body: "Sin capacitación. El personal ingresa o escanea el código del cliente, confirma la transacción, listo. El flujo completo toma menos de 10 segundos en el punto de venta.",
      },
      {
        title: "Funciona junto a tu configuración actual",
        body: "Fideliza no requiere un sistema POS específico ni un procesador de pagos. Es una capa de fidelización independiente que se suma a lo que ya usas.",
      },
    ],
    dashboard: {
      customers: "Clientes",
      thisMonth: "Este mes",
      redemptions: "Canjes",
      recentActivity: "Actividad reciente",
      activity: [
        { name: "Carol Osei", action: "Ganó 75 pts", time: "hace 2m" },
        {
          name: "Dan Kowalski",
          action: "Canjeó Rebanada Gratis",
          time: "hace 18m",
        },
        { name: "Alice Méndez", action: "Ganó 280 pts", time: "hace 1h" },
      ],
    },
  },

  pricing: {
    label: "Precios simples",
    heading: "Sin sorpresas. Sin costos ocultos.",
    body: "Comienza gratis y mejora solo cuando lo necesites. Los usuarios de acceso anticipado obtienen 1 mes de Starter gratis.",
    billingMonthly: "Mensual",
    billingAnnual: "Anual",
    annualBadge: "Ahorra 2 meses",
    annualNote: "facturado anualmente",
    plans: [
      {
        name: "Gratis",
        price: "$0",
        originalPrice: null,
        annualPrice: "$0",
        originalAnnualPrice: null,
        annualMonthly: null,
        period: "siempre",
        description:
          "Prueba Fideliza sin riesgo. Ideal para validar con tus primeros clientes.",
        badge: null,
        highlight: false,
        featuresIntro: null,
        features: [
          "Hasta 50 clientes",
          "1 programa de fidelización",
          "Puntos y sellos",
          "Tu propio subdominio",
          "Últimas 50 transacciones",
        ],
        cta: "Comienza gratis",
        href: "#waitlist",
      },
      {
        name: "Starter",
        price: "MX$349",
        originalPrice: "MX$549",
        annualPrice: "MX$3,490",
        originalAnnualPrice: "MX$5,490",
        annualMonthly: "MX$291/mes",
        period: "/mes",
        description:
          "Para negocios en crecimiento listos para convertir habituales en clientes leales.",
        badge: "Más popular",
        highlight: true,
        featuresIntro: "Todo lo de Gratis, más:",
        features: [
          "Hasta 300 clientes",
          "3 programas de fidelización",
          "Programas por visitas",
          "Portal del cliente y ofertas flash",
          "Catálogo de premios",
          "500 mensajes WhatsApp/mes",
        ],
        cta: "Acceso anticipado",
        href: "#waitlist",
      },
      {
        name: "Pro",
        price: "MX$699",
        originalPrice: "MX$1,099",
        annualPrice: "MX$6,990",
        originalAnnualPrice: "MX$10,990",
        annualMonthly: "MX$582/mes",
        period: "/mes",
        description:
          "Para negocios consolidados con una estrategia de fidelización seria.",
        badge: null,
        highlight: false,
        featuresIntro: "Todo lo de Starter, más:",
        features: [
          "Clientes y programas ilimitados",
          "Cashback y analíticas",
          "Referidos, niveles VIP y misiones",
          "Premios de cumpleaños y sorpresas",
          "Exportación CSV y soporte prioritario",
          "3,000 mensajes WhatsApp/mes",
        ],
        cta: "Acceso anticipado",
        href: "#waitlist",
        comingSoon: false,
      },
      {
        name: "Enterprise",
        price: "$1,699",
        originalPrice: null,
        annualPrice: "$16,990",
        originalAnnualPrice: null,
        annualMonthly: "$1,416/mes",
        period: "/mes",
        description:
          "Para cadenas y franquicias que necesitan gestionar múltiples ubicaciones desde un solo panel.",
        badge: "Próximamente",
        highlight: false,
        comingSoon: true,
        featuresIntro: "Todo lo de Pro, más:",
        features: [
          "Sucursales ilimitadas",
          "Staff y managers por sucursal",
          "Analíticas por ubicación",
          "Panel unificado multi-sucursal",
          "Soporte dedicado",
        ],
        cta: "Próximamente",
        href: "#",
      },
    ],
    comparison: {
      show: "Comparar todas las características",
      hide: "Ocultar comparación completa",
      featureCol: "Características",
      groups: [
        {
          name: "Lo esencial",
          rows: [
            { label: "Clientes", values: ["Hasta 50", "Hasta 300", "Ilimitados", "Ilimitados"] },
            { label: "Programas de fidelización", values: ["1", "3", "Ilimitados", "Ilimitados"] },
            { label: "Tipos de programa", values: ["Puntos y sellos", "Puntos, sellos y visitas", "Todos (incluye cashback)", "Todos (incluye cashback)"] },
            { label: "Tu propio subdominio", values: [true, true, true, true] },
            { label: "Códigos de acceso para clientes", values: [true, true, true, true] },
            { label: "Historial de transacciones", values: ["Últimas 50", "Completo", "Completo", "Completo"] },
          ],
        },
        {
          name: "Premios y engagement",
          rows: [
            { label: "Catálogo de premios", values: [false, "3 por programa", "5 por programa", "5 por programa"] },
            { label: "Portal del cliente", values: [false, true, true, true] },
            { label: "Ofertas flash", values: [false, true, true, true] },
            { label: "Impulso inicial de puntos", values: [false, true, true, true] },
          ],
        },
        {
          name: "Retención avanzada",
          rows: [
            { label: "Premios de cumpleaños", values: [false, false, true, true] },
            { label: "Niveles VIP", values: [false, false, true, true] },
            { label: "Sorpresas para clientes", values: [false, false, true, true] },
            { label: "Programa de referidos", values: [false, false, true, true] },
            { label: "Misiones y retos", values: [false, false, true, true] },
          ],
        },
        {
          name: "WhatsApp",
          rows: [
            { label: "Mensajes mensuales", values: [false, "500/mes", "3,000/mes", "3,000/mes"] },
            { label: "Campañas de marketing", values: [false, false, true, true] },
          ],
        },
        {
          name: "Datos y soporte",
          rows: [
            { label: "Analíticas", values: [false, false, true, "Por sucursal"] },
            { label: "Exportación CSV", values: [false, false, true, true] },
            { label: "Soporte", values: ["Básico", "Email", "Prioritario", "Dedicado"] },
          ],
        },
        {
          name: "Multi-sucursal",
          rows: [
            { label: "Sucursales", values: ["1", "1", "1", "Ilimitadas"] },
            { label: "Staff y managers por sucursal", values: [false, false, false, true] },
          ],
        },
      ],
    },
    footnote:
      "Precios previos al lanzamiento. Los miembros de acceso anticipado bloquean tarifas de fundadores.",
  },

  cta: {
    badge: "Acceso anticipado abierto",
    heading: "Lanza tu programa de fidelización esta semana",
    body: "Únete a la lista de espera y sé uno de los primeros negocios en usar Fideliza. Los miembros de acceso anticipado bloquean el precio fundador — 1 mes de Starter, gratis.",
    bullets: [
      "Configuración en menos de 5 minutos",
      "Cancela cuando quieras",
    ],
  },

  footer: {
    tagline:
      "Programas de fidelización para negocios independientes. Sin descargas. Sin complejidad. Solo clientes que regresan.",
    product: "Producto",
    legal: "Legal",
    nav: {
      product: [
        { label: "Funciones", href: "#features" },
        { label: "Cómo funciona", href: "#how-it-works" },
        { label: "Precios", href: "#pricing" },
        { label: "Acceso anticipado", href: "#waitlist" },
        { label: "Soporte", href: "/support" },
      ],
      legal: [
        { label: "Política de privacidad", href: "/privacy" },
        { label: "Términos de servicio", href: "/terms" },
      ],
    },
    copyright: "Todos los derechos reservados.",
    bottomTagline:
      "Hecho para negocios independientes que merecen mejores herramientas.",
  },

  multiDevice: {
    label: "Accede desde cualquier lugar",
    heading: "Funciona en cualquier pantalla, cualquier dispositivo",
    body: "Administra tu programa desde la computadora, revisa estadísticas en la tablet entre turnos, o registra un cliente directo desde el celular — solo necesitas conexión a internet.",
    devices: [
      {
        name: "Computadora",
        description: "Experiencia completa del panel. Gestiona clientes, crea programas, visualiza reportes y exporta datos desde tu escritorio o laptop.",
        hint: "Recomendado para la gestión diaria",
      },
      {
        name: "Tablet",
        description: "Perfecta para el mostrador. Registra clientes, asigna puntos y verifica vouchers sin alejarte de la caja.",
        hint: "Ideal en el punto de venta",
      },
      {
        name: "Celular",
        description: "Acceso rápido desde donde estés. Consulta saldos, registra una transacción o verifica un canje desde cualquier parte del local.",
        hint: "Perfecto para transacciones rápidas",
      },
    ],
    wifi: "Requiere conexión a internet activa (Wi-Fi o datos móviles)",
  },

  faq: {
    label: "FAQ",
    heading: "Preguntas frecuentes",
    body: "Todo lo que necesitas saber antes de empezar.",
    items: [
      {
        question: "¿Mis clientes necesitan descargar una app?",
        answer: "No. Los clientes se identifican con un código de acceso único de 10 caracteres que tú les das. Pueden ver su saldo desde cualquier navegador — sin app, sin cuenta, sin contraseña.",
      },
      {
        question: "¿Cuánto tiempo tarda la configuración?",
        answer: "Menos de 5 minutos. Regístrate, elige tu subdominio, crea tu primer programa y empieza a agregar clientes. No se requieren conocimientos técnicos.",
      },
      {
        question: "¿Puedo tener varios programas de fidelización al mismo tiempo?",
        answer: "Sí. El plan Gratis incluye 1 programa, Starter incluye 3 y Pro te da programas ilimitados. Puedes tener una tarjeta de sellos y un programa de puntos funcionando a la vez en la misma cuenta.",
      },
      {
        question: "¿Qué pasa si un cliente pierde su código de acceso?",
        answer: "Puedes buscar cualquier cliente desde tu panel y copiar o compartir su código en cualquier momento. Como no hay app ni contraseña, no hay nada que restablecer.",
      },
      {
        question: "¿Fideliza funciona con mi sistema de punto de venta?",
        answer: "Sí. Fideliza es una capa de fidelización independiente — no reemplaza tu sistema de cobro. El personal ingresa o escanea el código del cliente por separado, sin ninguna integración.",
      },
      {
        question: "¿Puedo cancelar cuando quiera?",
        answer: "Sí. No hay contratos a largo plazo ni cargos por cancelación. Puedes cancelar tu suscripción desde la configuración de facturación en cualquier momento y conservar el acceso hasta el fin de tu período pagado.",
      },
      {
        question: "¿Los datos de mis clientes están seguros?",
        answer: "Sí. Cada negocio en Fideliza opera en un entorno completamente aislado. Tus clientes, transacciones y premios están totalmente separados de cualquier otra cuenta en la plataforma.",
      },
      {
        question: "¿En qué se diferencia Fideliza de Stamp Me, Loopy Loyalty o Fivestars?",
        answer: "La diferencia principal es que Fideliza no requiere que tus clientes descarguen una app ni creen una cuenta. Con Stamp Me o Loopy Loyalty, el cliente necesita instalar una aplicación en su teléfono — eso genera fricción y reduce la adopción. En Fideliza, el cliente solo necesita su código de 10 caracteres para acceder desde cualquier navegador. Además, Fideliza está diseñado para negocios en México y Latinoamérica, con precios en pesos mexicanos y soporte en español.",
      },
      {
        question: "¿Para qué tipo de negocio funciona Fideliza?",
        answer: "Fideliza funciona para cualquier negocio que quiera retener clientes habituales: restaurantes, cafeterías, barberías, salones de belleza, panaderías, tiendas de ropa, gimnasios, farmacias y más. Si tienes clientes que regresan regularmente y quieres recompensarlos sin complicaciones técnicas, Fideliza es para ti. No necesitas un equipo de tecnología ni una integración con tu sistema de cobro — funciona de forma independiente en menos de 5 minutos.",
      },
    ],
  },

  waitlistForm: {
    emailPlaceholder: "tu@email.com",
    phonePlaceholder: "Número de teléfono",
    submitButton: "Unirse a la lista",
    optional: "opcional",
    required: "obligatorio",
    optionalToggle: "+ Agrega tu nombre y negocio (opcional)",
    namePlaceholder: "Tu nombre",
    businessPlaceholder: "Nombre del negocio",
    disclaimer: "Sin spam. Cancela cuando quieras.",
    successTitle: "¡Estás en la lista!",
    successMessage: "Te avisaremos cuando Fideliza lance oficialmente.",
    alreadyOnList: "¡Ya estás en la lista! Pronto estaremos en contacto.",
    errors: {
      nameRequired: "Ingresa tu nombre.",
      emailInvalid: "Ingresa un correo electrónico válido.",
      emailTooLong: "El correo electrónico es demasiado largo.",
      phoneInvalid: "Ingresa un número de teléfono válido.",
      nameInvalid: "El nombre solo puede contener letras y espacios.",
      nameTooLong: "El nombre es demasiado largo (máx. 60 caracteres).",
      businessTooLong: "El nombre del negocio es demasiado largo (máx. 100 caracteres).",
      generic: "Algo salió mal. Inténtalo de nuevo.",
      serverUnreachable: "No se pudo contactar el servidor. Inténtalo de nuevo.",
    },
  },

  notFound: {
    title: "Página no encontrada",
    description: "La página que buscas no existe o ha sido movida. Volvamos a encaminarte.",
    backHome: "Volver al inicio",
    contactSupport: "Contactar soporte",
    logoAriaLabel: "Fideliza — Volver al inicio",
    metaTitle: "404 — Página no encontrada | Fideliza",
    metaDescription: "La página que buscabas no existe.",
  },
};
