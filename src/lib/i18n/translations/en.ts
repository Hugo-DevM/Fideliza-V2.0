export const en = {
  navbar: {
    howItWorks: "How it works",
    features: "Features",
    pricing: "Pricing",
    faq: "FAQ",
    signIn: "Sign in",
    cta: "Get early access",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    manual: "Docs",
  },

  hero: {
    badge: "Now in early access",
    headingPlain: "Loyalty programs that ",
    headingGradient: "actually get used",
    body: "Give your customers a digital loyalty card — no app download, no account creation. Just a unique code. Your business gets a branded subdomain and a full dashboard to manage points, stamps, and rewards.",
    cta1: "Get early access — it's free",
    cta2: "See how it works",
    socialProofCount: "40+ businesses",
    socialProofText: "already on the waitlist",
    card: {
      noAppBadge: "No app needed",
      pointsLabel: "Brew Points",
      lifetimeLabel: "Lifetime",
      untilNextReward: "150 pts until next reward",
      punchCardLabel: "Coffee Punch Card — 7 of 10",
      accessCodeLabel: "Access code",
    },
  },

  howItWorks: {
    label: "Simple by design",
    heading: "Up and running in minutes",
    body: "No complex setup. No training required. Fideliza is built for business owners, not developers.",
    steps: [
      {
        title: "Sign up and claim your subdomain",
        description:
          "Create your account in under 2 minutes. Your business gets a branded URL like yourshop.fideliza.app — no technical setup required.",
      },
      {
        title: "Design your loyalty program",
        description:
          "Choose your reward mechanic — points per purchase, a stamp card, or visit-based rewards. Configure what customers earn and what they can redeem.",
      },
      {
        title: "Add customers — they get a unique code",
        description:
          "Register customers from your dashboard. Each customer receives a personal access code — no app, no password, no friction. Share it as a QR code or printed card.",
      },
      {
        title: "Customers earn and redeem — instantly",
        description:
          "Scan or enter the code at the point of sale. Points are added in real time. When customers redeem a reward, staff verify the one-time voucher code — no app needed on either side.",
      },
    ],
  },

  features: {
    label: "What's included",
    heading: "Everything your loyalty program needs",
    body: "Built specifically for small and medium businesses that want real customer retention — without enterprise complexity.",
    items: [
      {
        badge: "Multi-program",
        badgeColor: "indigo" as const,
        title: "Points, stamps, and visits — your choice",
        description:
          "Run multiple loyalty programs at once. A coffee punch card AND a points program on the same account. Each program has its own balance, rewards, and configuration.",
      },
      {
        badge: "Zero friction",
        badgeColor: "green" as const,
        title: "Customers need nothing — just their code",
        description:
          "No app. No account. No password. Customers identify themselves with an 8-character code you give them. They can check their balance at yourshop.fideliza.app anytime.",
      },
      {
        badge: "Multi-tenant",
        badgeColor: "indigo" as const,
        title: "Your own branded subdomain",
        description:
          "Every business on Fideliza gets an isolated subdomain like marios.fideliza.app. Your data, your customers, your brand — completely separate from every other business.",
      },
      {
        badge: "Real-time",
        badgeColor: "amber" as const,
        title: "Live balance and transaction history",
        description:
          "Every point earned or redeemed is recorded instantly. Full transaction ledger for your records. See what rewards are driving engagement and which customers are most loyal.",
      },
    ],
    visuals: {
      programTypes: {
        types: [
          { label: "Points", active: true },
          { label: "Stamps", active: false },
          { label: "Visits", active: false },
        ],
        balance: "350 pts",
        nextReward: "Next reward: 150 pts",
      },
      accessCode: {
        status: "Active",
        hint: "No registration required — code is all they need",
      },
      subdomain: {
        hint: "Data isolated per tenant — no cross-contamination",
      },
      transaction: {
        rows: [
          { label: "Purchase $28.00", points: "+280", type: "earn" as const },
          { label: "Purchase $12.50", points: "+125", type: "earn" as const },
          {
            label: "Redeemed: Free Coffee",
            points: "−250",
            type: "redeem" as const,
          },
        ],
        balanceLabel: "Balance",
      },
    },
  },

  benefits: {
    stats: [
      {
        stat: "0",
        unit: "App downloads",
        description:
          "Customers never visit an app store. Access codes work from any browser or printed card.",
      },
      {
        stat: "< 5",
        unit: "Minutes to launch",
        description:
          "Sign up, configure your program, add your first customer. That's it. No IT department needed.",
      },
      {
        stat: "100%",
        unit: "Data isolation",
        description:
          "Your customers are yours. No shared pools, no leakage. Every tenant runs on a fully isolated account.",
      },
      {
        stat: "∞",
        unit: "Program types",
        description:
          "Run a points program and a stamp card simultaneously. Different mechanics for different audiences.",
      },
    ],
    label: "Built for businesses",
    heading: "More return visits, less guesswork",
    body: "Loyalty shouldn't require a developer, a dedicated app, or a six-month onboarding process. Fideliza is the loyalty platform that independent businesses can actually use and afford.",
    items: [
      {
        title: "Retain customers, not just attract them",
        body: "Loyalty programs increase repeat visit frequency by giving customers a tangible reason to come back. Track who's loyal and reward them before they leave.",
      },
      {
        title: "Know who your best customers are",
        body: "See lifetime points, visit history, and redemption patterns for every customer. Your most loyal regulars are visible at a glance — no spreadsheets required.",
      },
      {
        title: "Staff can use it in seconds",
        body: "No training required. Staff enter or scan the customer's code, confirm the transaction, done. The whole flow takes under 10 seconds at the point of sale.",
      },
      {
        title: "Works alongside your existing setup",
        body: "Fideliza doesn't require a specific POS system or payment processor. It's a standalone loyalty layer that sits on top of whatever you already use.",
      },
    ],
    dashboard: {
      customers: "Customers",
      thisMonth: "This month",
      redemptions: "Redemptions",
      recentActivity: "Recent activity",
      activity: [
        { name: "Carol Osei", action: "Earned 75 pts", time: "2m ago" },
        {
          name: "Dan Kowalski",
          action: "Redeemed Free Slice",
          time: "18m ago",
        },
        { name: "Alice Méndez", action: "Earned 280 pts", time: "1h ago" },
      ],
    },
  },

  pricing: {
    label: "Simple pricing",
    heading: "No surprises. No hidden fees.",
    body: "Start free and upgrade only when you need to. Early access users get 1 month of Starter free.",
    billingMonthly: "Monthly",
    billingAnnual: "Annual",
    annualBadge: "Save 2 months",
    annualNote: "billed annually",
    plans: [
      {
        name: "Free",
        price: "$0",
        annualPrice: "$0",
        annualMonthly: null,
        period: "forever",
        description:
          "Try Fideliza risk-free. Good for validating with your first customers.",
        badge: null,
        highlight: false,
        features: [
          "Up to 50 customers",
          "1 loyalty program",
          "Points and stamps",
          "Your own subdomain",
          "Customer access codes",
          "Last 50 transactions",
        ],
        missing: [
          "Visit rewards & cashback",
          "Reward catalog",
          "Analytics",
          "CSV export",
          "Priority support",
        ],
        cta: "Start for free",
        href: "#waitlist",
      },
      {
        name: "Starter",
        price: "$29",
        annualPrice: "$290",
        annualMonthly: "$24/mo",
        period: "/month",
        description:
          "For growing businesses ready to turn regulars into loyal customers.",
        badge: "Most popular",
        highlight: true,
        features: [
          "Up to 300 customers",
          "3 loyalty programs",
          "Points, stamps, and visits",
          "Your own subdomain",
          "Customer access codes",
          "Full transaction history",
          "Reward catalog",
          "Email support",
        ],
        missing: ["Cashback", "Analytics", "CSV export", "Priority support"],
        cta: "Get early access",
        href: "#waitlist",
      },
      {
        name: "Pro",
        price: "$59",
        annualPrice: "$590",
        annualMonthly: "$49/mo",
        period: "/month",
        description:
          "For established businesses with a serious loyalty strategy.",
        badge: null,
        highlight: false,
        features: [
          "Unlimited customers",
          "Unlimited programs",
          "All program types",
          "Your own subdomain",
          "Customer access codes",
          "Full transaction history",
          "Reward catalog",
          "Analytics",
          "Priority support",
          "CSV export",
        ],
        missing: [],
        cta: "Get early access",
        href: "#waitlist",
        comingSoon: false,
      },
      {
        name: "Enterprise",
        price: "$99",
        annualPrice: "$990",
        annualMonthly: "$82/mo",
        period: "/month",
        description:
          "For chains and franchises that need to manage multiple locations from a single dashboard.",
        badge: "Coming soon",
        highlight: false,
        comingSoon: true,
        features: [
          "Everything in Pro",
          "Unlimited branches",
          "Staff & managers per location",
          "Per-location analytics",
          "Unified multi-branch dashboard",
          "Dedicated support",
        ],
        missing: [],
        cta: "Coming soon",
        href: "#",
      },
    ],
    footnote:
      "Pricing shown is pre-launch. Early access members lock in founder rates.",
  },

  cta: {
    badge: "Early access open",
    heading: "Launch your loyalty program this week",
    body: "Join the waitlist and be among the first businesses to run Fideliza. Early access members lock in founder pricing — 1 month of Starter, free.",
    bullets: [
      "No credit card required",
      "Set up in under 5 minutes",
      "Cancel anytime",
    ],
  },

  footer: {
    tagline:
      "Loyalty programs for independent businesses. No app downloads. No complexity. Just customers coming back.",
    product: "Product",
    legal: "Legal",
    nav: {
      product: [
        { label: "Features", href: "#features" },
        { label: "How it works", href: "#how-it-works" },
        { label: "Pricing", href: "#pricing" },
        { label: "Early access", href: "#waitlist" },
      ],
      legal: [
        { label: "Privacy policy", href: "/privacy" },
        { label: "Terms of service", href: "/terms" },
      ],
    },
    copyright: "All rights reserved.",
    bottomTagline:
      "Built for independent businesses that deserve better tools.",
  },

  multiDevice: {
    label: "Access from anywhere",
    heading: "Works on any screen, any device",
    body: "Manage your loyalty program from your computer, check stats on your tablet between shifts, or register a customer right from your phone — all you need is a Wi-Fi connection.",
    devices: [
      {
        name: "Computer",
        description: "Full dashboard experience. Manage customers, create programs, view reports, and export data from your desktop or laptop.",
        hint: "Recommended for daily management",
      },
      {
        name: "Tablet",
        description: "Perfect for the counter. Register customers, assign points, and verify vouchers without leaving the register.",
        hint: "Great at the point of sale",
      },
      {
        name: "Phone",
        description: "Quick access on the go. Check customer balances, register a transaction, or verify a redemption from anywhere in the venue.",
        hint: "Ideal for quick transactions",
      },
    ],
    wifi: "Requires an active internet connection (Wi-Fi or mobile data)",
  },

  faq: {
    label: "FAQ",
    heading: "Frequently asked questions",
    body: "Everything you need to know before getting started.",
    items: [
      {
        question: "Do my customers need to download an app?",
        answer: "No. Customers identify themselves with a unique 8-character access code you give them. They can check their balance from any browser — no app, no account, no password.",
      },
      {
        question: "How long does setup take?",
        answer: "Under 5 minutes. Sign up, claim your subdomain, create your first loyalty program, and start adding customers. No technical knowledge required.",
      },
      {
        question: "Can I run multiple loyalty programs at the same time?",
        answer: "Yes. The Free plan includes 1 program, Starter includes 3, and Pro gives you unlimited programs. You can run a stamp card and a points program simultaneously on the same account.",
      },
      {
        question: "What happens if a customer loses their access code?",
        answer: "You can look up any customer from your dashboard and resend or copy their access code at any time. Since there's no app or password, there's nothing to reset.",
      },
      {
        question: "Does Fideliza work with my existing POS system?",
        answer: "Yes. Fideliza is a standalone loyalty layer — it doesn't replace your point-of-sale system. Staff enter or scan the customer's code independently, without any integration required.",
      },
      {
        question: "Can I cancel at any time?",
        answer: "Absolutely. There are no long-term contracts or cancellation fees. You can cancel your subscription from the billing settings at any time and keep access until the end of your billing period.",
      },
      {
        question: "Is my customer data safe?",
        answer: "Yes. Every business on Fideliza runs in a fully isolated environment. Your customers, transactions, and rewards are completely separate from every other account on the platform.",
      },
    ],
  },

  waitlistForm: {
    emailPlaceholder: "your@email.com",
    phonePlaceholder: "Phone number",
    submitButton: "Join waitlist",
    optional: "optional",
    required: "required",
    optionalToggle: "+ Add your name and business (optional)",
    namePlaceholder: "Your name",
    businessPlaceholder: "Business name",
    disclaimer: "No credit card. No spam. Unsubscribe anytime.",
    successTitle: "You're on the list!",
    successMessage: "We'll notify you when Fideliza launches.",
    alreadyOnList: "You're already on the list! We'll be in touch soon.",
    errors: {
      nameRequired: "Please enter your name.",
      emailInvalid: "Please enter a valid email address.",
      emailTooLong: "Email address is too long.",
      phoneInvalid: "Please enter a valid phone number.",
      nameInvalid: "Name can only contain letters and spaces.",
      nameTooLong: "Name is too long (max 60 characters).",
      businessTooLong: "Business name is too long (max 100 characters).",
      generic: "Something went wrong. Please try again.",
      serverUnreachable: "Could not reach the server. Please try again.",
    },
  },

  notFound: {
    title: "Page not found",
    description: "The page you're looking for doesn't exist or has been moved. Let's get you back on track.",
    backHome: "Back to home",
    contactSupport: "Contact support",
    logoAriaLabel: "Fideliza — Back to home",
    metaTitle: "404 — Page Not Found | Fideliza",
    metaDescription: "The page you were looking for does not exist.",
  },
};
