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
    headingPlain: "Make your customers ",
    headingGradient: "come back again and again",
    body: "Fideliza is the complete retention system for your business: points, stamps and cashback, VIP tiers, referrals, missions, birthday rewards, and WhatsApp campaigns. All without your customers downloading an app — just a code.",
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
          "Choose your reward mechanic — points per purchase, a stamp card, visit-based rewards, or cashback. Then switch on flash offers, missions, VIP tiers, and referrals whenever you're ready.",
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
    heading: "Everything you need to keep customers coming back",
    body: "A complete retention system built for small and medium businesses — without enterprise complexity or enterprise pricing.",
    items: [
      {
        badge: "Flexible programs",
        badgeColor: "indigo" as const,
        title: "Points, stamps, visits, and cashback",
        description:
          "Run multiple loyalty programs at once, each with its own mechanic, balance, and rewards. Configure what customers earn, what they can redeem, and what every purchase is worth.",
      },
      {
        badge: "Reasons to return",
        badgeColor: "amber" as const,
        title: "Flash offers, missions, and birthday rewards",
        description:
          "Create urgency with limited-time offers, launch missions with bonus rewards, and surprise customers on their birthday or when they haven't visited in a while — automatically.",
      },
      {
        badge: "Automatic growth",
        badgeColor: "green" as const,
        title: "VIP tiers and referrals that work for you",
        description:
          "Your best customers climb to Silver, Gold, and Platinum with growing benefits, and every customer can bring you new ones with their referral link — both earn points.",
      },
      {
        badge: "WhatsApp + analytics",
        badgeColor: "indigo" as const,
        title: "Messages that bring customers back",
        description:
          "Send WhatsApp campaigns and reminders — expiring rewards, birthdays, win-back offers — and measure everything: visits, redemptions, and who your most loyal customers are.",
      },
    ],
    visuals: {
      programTypes: {
        types: [
          { label: "Points", active: true },
          { label: "Stamps", active: false },
          { label: "Visits", active: false },
          { label: "Cashback", active: false },
        ],
        balance: "350 pts",
        nextReward: "Next reward: 150 pts",
      },
      engagement: {
        rows: [
          { icon: "flash" as const, title: "Flash offer: 2x1 lattes", meta: "Ends in 05:12:44" },
          { icon: "mission" as const, title: "Mission: visit 3x this week", meta: "+200 pts bonus" },
          { icon: "birthday" as const, title: "Birthday reward sent to Alice", meta: "Automatic" },
        ],
      },
      growth: {
        tiers: [
          { label: "Silver", active: false },
          { label: "Gold", active: true },
          { label: "Platinum", active: false },
        ],
        tierHint: "María reached Gold · 2x points",
        referral: "María referred 3 friends",
        referralPoints: "+450 pts",
      },
      whatsapp: {
        sender: "Fideliza · WhatsApp",
        message: "Hi Ana! 🎁 Your free-coffee reward expires in 3 days. Come see us!",
        time: "10:42",
        statLabel: "Redemptions this month",
        statValue: "32",
        statDelta: "▲ 18%",
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
        unit: "Ways to bring them back",
        description:
          "Points, stamps, visits, and cashback — plus flash offers, missions, VIP tiers, and referrals layered on top.",
      },
    ],
    label: "Built for businesses",
    heading: "More return visits, less guesswork",
    body: "Retention shouldn't require a developer, a dedicated app, or a six-month onboarding process. Fideliza is the retention system that independent businesses can actually use and afford.",
    items: [
      {
        title: "Retain customers, not just attract them",
        body: "Flash offers, missions, and VIP tiers give customers tangible reasons to return — and when someone stops visiting, Fideliza can send them a win-back reward on WhatsApp automatically.",
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
        originalPrice: null,
        annualPrice: "$0",
        originalAnnualPrice: null,
        annualMonthly: null,
        period: "forever",
        description:
          "Try Fideliza risk-free. Good for validating with your first customers.",
        badge: null,
        highlight: false,
        featuresIntro: null as string | null,
        features: [
          "Up to 50 customers",
          "1 loyalty program",
          "Points and stamps",
          "Your own subdomain",
          "Customer portal (Fideliza branding)",
          "Last 50 transactions",
        ],
        cta: "Start for free",
        href: "#waitlist",
      },
      {
        name: "Starter",
        price: "$29",
        originalPrice: null as string | null,
        annualPrice: "$290",
        originalAnnualPrice: null as string | null,
        annualMonthly: "$24/mo",
        period: "/month",
        description:
          "For growing businesses ready to turn regulars into loyal customers.",
        badge: "Most popular",
        highlight: true,
        featuresIntro: "Everything in Free, plus:" as string | null,
        features: [
          "Up to 300 customers",
          "3 loyalty programs",
          "Visit-based programs",
          "Portal with your logo & colors",
          "Reward catalog & flash offers",
          "500 WhatsApp messages/month",
        ],
        cta: "Get early access",
        href: "#waitlist",
      },
      {
        name: "Pro",
        price: "$59",
        originalPrice: null as string | null,
        annualPrice: "$590",
        originalAnnualPrice: null as string | null,
        annualMonthly: "$49/mo",
        period: "/month",
        description:
          "For established businesses with a serious loyalty strategy.",
        badge: null,
        highlight: false,
        featuresIntro: "Everything in Starter, plus:" as string | null,
        features: [
          "Unlimited customers & programs",
          "Cashback & analytics",
          "Referrals, VIP tiers & missions",
          "Birthday rewards & surprises",
          "CSV export & priority support",
          "3,000 WhatsApp messages/month",
        ],
        cta: "Get early access",
        href: "#waitlist",
        comingSoon: false,
      },
      {
        name: "Enterprise",
        price: "$99",
        originalPrice: null,
        annualPrice: "$990",
        originalAnnualPrice: null,
        annualMonthly: "$82/mo",
        period: "/month",
        description:
          "For chains and franchises that need to manage multiple locations from a single dashboard.",
        badge: "Coming soon",
        highlight: false,
        comingSoon: true,
        featuresIntro: "Everything in Pro, plus:" as string | null,
        features: [
          "Unlimited branches",
          "Staff & managers per location",
          "Per-location analytics",
          "Unified multi-branch dashboard",
          "Dedicated support",
        ],
        cta: "Coming soon",
        href: "#",
      },
    ],
    comparison: {
      show: "Compare all features",
      hide: "Hide full comparison",
      featureCol: "Features",
      groups: [
        {
          name: "Essentials",
          rows: [
            { label: "Customers", values: ["Up to 50", "Up to 300", "Unlimited", "Unlimited"] },
            { label: "Loyalty programs", values: ["1", "3", "Unlimited", "Unlimited"] },
            { label: "Program types", values: ["Points & stamps", "Points, stamps & visits", "All (incl. cashback)", "All (incl. cashback)"] },
            { label: "Your own subdomain", values: [true, true, true, true] },
            { label: "Customer access codes", values: [true, true, true, true] },
            { label: "Transaction history", values: ["Last 50", "Full", "Full", "Full"] },
          ],
        },
        {
          name: "Rewards & engagement",
          rows: [
            { label: "Reward catalog", values: [false, "3 per program", "5 per program", "5 per program"] },
            { label: "Customer portal", values: ["Fideliza branding", true, true, true] },
            { label: "Your logo & colors on the portal", values: [false, true, true, true] },
            { label: "Flash offers", values: [false, true, true, true] },
            { label: "Points head start", values: [false, true, true, true] },
          ],
        },
        {
          name: "Advanced retention",
          rows: [
            { label: "Birthday rewards", values: [false, false, true, true] },
            { label: "VIP tiers", values: [false, false, true, true] },
            { label: "Surprise & delight", values: [false, false, true, true] },
            { label: "Referral program", values: [false, false, true, true] },
            { label: "Missions & challenges", values: [false, false, true, true] },
          ],
        },
        {
          name: "WhatsApp",
          rows: [
            { label: "Monthly messages", values: [false, "500/month", "3,000/month", "3,000/month"] },
            { label: "Marketing campaigns", values: [false, false, true, true] },
          ],
        },
        {
          name: "Data & support",
          rows: [
            { label: "Analytics", values: [false, false, true, "Per location"] },
            { label: "CSV export", values: [false, false, true, true] },
            { label: "Support", values: ["Basic", "Email", "Priority", "Dedicated"] },
          ],
        },
        {
          name: "Multi-location",
          rows: [
            { label: "Branches", values: ["1", "1", "1", "Unlimited"] },
            { label: "Staff & managers per location", values: [false, false, false, true] },
          ],
        },
      ] as { name: string; rows: { label: string; values: (string | boolean)[] }[] }[],
    },
    coupon: {
      code: "FIDELIZA10",
      intro: "Founders coupon",
      introShort: "25% off your first payment",
      description: "25% off your first payment on Starter or Pro — monthly or annual — with coupon",
      remaining: "{n} of {total} left",
      soldOut: "Coupons sold out",
      copy: "Copy code",
      copied: "Copied!",
    },
    footnote:
      "Prices in Mexican pesos (MXN). Cancel or switch plans anytime.",
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
        { label: "Support", href: "/support" },
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
        answer: "No. Customers identify themselves with a unique 10-character access code you give them. They can check their balance from any browser — no app, no account, no password.",
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
      {
        question: "How is Fideliza different from Stamp Me, Loopy Loyalty, or Fivestars?",
        answer: "The main difference is that Fideliza doesn't require your customers to download an app or create an account. With Stamp Me or Loopy Loyalty, customers need to install an app on their phone — that friction reduces adoption. With Fideliza, customers only need their 10-character code to access their rewards from any browser. No app, no sign-up, no barrier.",
      },
      {
        question: "What type of business is Fideliza for?",
        answer: "Fideliza works for any business with repeat customers: restaurants, coffee shops, barbershops, hair salons, bakeries, clothing stores, gyms, pharmacies, and more. If customers come back regularly and you want to reward them without technical complexity, Fideliza is for you. No tech team needed, no POS integration required — you're up and running in under 5 minutes.",
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
