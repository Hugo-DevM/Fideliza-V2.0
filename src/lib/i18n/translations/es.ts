import type { Dictionary } from "../index";

export const es: Dictionary = {
  meta: {
    title: "Fideliza+ — Programas de Fidelización para Negocios Independientes",
    description:
      "Lanza un programa de fidelización que tus clientes realmente usen — sin descargas, sin configuraciones complejas. Puntos, sellos y visitas. Tu propio subdominio. En marcha en menos de 5 minutos.",
    ogTitle:
      "Fideliza+ — Programas de Fidelización para Negocios Independientes",
    ogDescription:
      "Sin descargas. Sin complejidad. Un programa de fidelización real en menos de 5 minutos. Puntos, sellos, visitas — tus clientes vuelven.",
  },

  navbar: {
    howItWorks: "Cómo funciona",
    features: "Funciones",
    pricing: "Precios",
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
    body: "Sin configuraciones complejas. Sin capacitación. Fideliza+ está hecho para dueños de negocios, no para desarrolladores.",
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
          "Cada negocio en Fideliza+ obtiene un subdominio aislado como marios.fideliza.app. Tus datos, tus clientes, tu marca — completamente separados de los demás negocios.",
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
    body: "La fidelización no debería requerir un desarrollador, una app dedicada ni seis meses de implementación. Fideliza+ es la plataforma que los negocios independientes pueden usar y costear.",
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
        body: "Fideliza+ no requiere un sistema POS específico ni un procesador de pagos. Es una capa de fidelización independiente que se suma a lo que ya usas.",
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
    plans: [
      {
        name: "Gratis",
        price: "$0",
        period: "siempre",
        description:
          "Prueba Fideliza+ sin riesgo. Ideal para validar con tus primeros clientes.",
        badge: null,
        highlight: false,
        features: [
          "Hasta 50 clientes",
          "1 programa de fidelización",
          "Puntos y sellos",
          "Tu propio subdominio",
          "Códigos de acceso para clientes",
          "Últimas 50 transacciones",
        ],
        missing: [
          "Premios por visitas",
          "Catálogo de premios",
          "Exportación CSV",
          "Soporte prioritario",
        ],
        cta: "Comienza gratis",
        href: "#waitlist",
      },
      {
        name: "Starter",
        price: "$29",
        period: "/mes",
        description:
          "Para negocios en crecimiento listos para convertir habituales en clientes leales.",
        badge: "Más popular",
        highlight: true,
        features: [
          "Hasta 500 clientes",
          "3 programas de fidelización",
          "Puntos, sellos y visitas",
          "Tu propio subdominio",
          "Códigos de acceso para clientes",
          "Historial completo de transacciones",
          "Catálogo de premios",
          "Soporte por email",
        ],
        missing: ["Exportación CSV", "Soporte prioritario"],
        cta: "Acceso anticipado",
        href: "#waitlist",
      },
      {
        name: "Pro",
        price: "$59",
        period: "/mes",
        description:
          "Para negocios consolidados con una estrategia de fidelización seria.",
        badge: null,
        highlight: false,
        features: [
          "Clientes ilimitados",
          "Programas ilimitados",
          "Todos los tipos de programa",
          "Tu propio subdominio",
          "Códigos de acceso para clientes",
          "Historial completo de transacciones",
          "Catálogo de premios",
          "Soporte prioritario",
          "Exportación CSV",
        ],
        missing: [],
        cta: "Acceso anticipado",
        href: "#waitlist",
      },
    ],
    footnote:
      "Precios previos al lanzamiento. Los miembros de acceso anticipado bloquean tarifas de fundadores.",
  },

  cta: {
    badge: "Acceso anticipado abierto",
    heading: "Lanza tu programa de fidelización esta semana",
    body: "Únete a la lista de espera y sé uno de los primeros negocios en usar Fideliza+. Los miembros de acceso anticipado bloquean el precio fundador — 1 mes de Starter, gratis.",
    bullets: [
      "Sin tarjeta de crédito",
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

  waitlistForm: {
    emailPlaceholder: "tu@email.com",
    submitButton: "Unirse a la lista",
    optionalToggle: "+ Agrega tu nombre y negocio (opcional)",
    namePlaceholder: "Tu nombre",
    businessPlaceholder: "Nombre del negocio",
    disclaimer: "Sin tarjeta de crédito. Sin spam. Cancela cuando quieras.",
    successTitle: "¡Estás en la lista!",
  },
};
