import {
  Section, SubSection, GuiddeBox, DataTable, StepList, Note, Code, InlineCode,
} from '../components';

export const tocEn = [
  { id: 'introduccion',    label: '1. Introduction' },
  { id: 'primeros-pasos',  label: '2. Getting started' },
  { id: 'navegacion',      label: '3. Navigation' },
  { id: 'dashboard',       label: '4.1 Overview' },
  { id: 'registro-rapido', label: '4.2 Quick register' },
  { id: 'clientes',        label: '4.3 Customers' },
  { id: 'programas',       label: '4.4 Programs' },
  { id: 'recompensas',     label: '4.5 Rewards' },
  { id: 'referidos',       label: '4.6 Referrals' },
  { id: 'niveles',         label: '4.7 VIP tiers' },
  { id: 'bonos',           label: '4.8 Bonuses' },
  { id: 'analiticas',      label: '4.9 Analytics' },
  { id: 'portal-cliente',  label: '4.10 Customer portal' },
  { id: 'configuracion',   label: '4.11 Settings & branding' },
  { id: 'soporte',         label: '4.12 Support' },
  { id: 'whatsapp',        label: '5. WhatsApp' },
  { id: 'facturacion',     label: '6. Billing' },
  { id: 'planes',          label: '7. Plans' },
  { id: 'errores',         label: '8. Errors & validations' },
  { id: 'buenas-practicas',label: '9. Best practices' },
  { id: 'faq',             label: '10. FAQ' },
];

export function ContentEn() {
  return (
    <>
      {/* ─ 1. Introduction ─ */}
      <Section id="introduccion" title="1. Introduction">
        <p>
          <strong className="text-indigo-400 font-bold">Fideliza</strong> is a customer
          loyalty SaaS platform. It lets businesses create and run loyalty programs with no
          mobile app and no special hardware.
        </p>
        <DataTable
          headers={['Actor', 'How they sign in', 'URL']}
          rows={[
            ['Business (admin)', 'Email + password, or Google account', 'fideliza.app/auth/login'],
            ['End customer',     'Access code (no password)',           '[yourshop].fideliza.app/c'],
          ]}
        />
        <Note>
          Every business gets its own subdomain — for example{' '}
          <Code>cafeteria-roma.fideliza.app</Code>. Each business&apos;s data is fully
          isolated from every other business.
        </Note>
      </Section>

      {/* ─ 2. Getting started ─ */}
      <Section id="primeros-pasos" title="2. Getting started">
        <SubSection id="registro" title="2.1 Create an account">
          <p>
            Sign-up takes <strong className="text-white">2 steps</strong> plus an email
            confirmation.
          </p>

          <p className="font-medium text-white">Step 1 — Account details</p>
          <StepList steps={[
            'Go to fideliza.app/auth/register',
            'Enter your full name',
            'Enter your email address',
            'Create a password (8 characters minimum) — a strength meter is shown',
            'Confirm the password',
            'Accept the Terms of Service and Privacy Policy',
            'Click Continue',
          ]} />

          <p className="font-medium text-white pt-2">Step 2 — Business details</p>
          <StepList steps={[
            'Enter your business name',
            'A subdomain is suggested automatically (e.g. cafeteria-roma)',
            'You can edit it — availability is checked in real time',
            'Once available you will see your portal URL: [subdomain].fideliza.app/c',
            'Click Create account',
          ]} />

          <p className="font-medium text-white pt-2">Step 3 — Confirm your email</p>
          <StepList steps={[
            'You land on a "Check your email" screen',
            'Open the email from Fideliza and click the confirmation link',
            'Your account is now active and you are taken into the dashboard',
          ]} />

          <Note>
            The subdomain must be 3–63 characters, lowercase letters, numbers and hyphens
            only. It cannot start or end with a hyphen.
          </Note>

          <p className="pt-2">
            You can also use <strong className="text-white">Sign up with Google</strong>. In
            that case your email arrives already verified by Google and you are only asked
            for the business details.
          </p>
        </SubSection>

        <SubSection id="primer-ingreso" title="2.2 First sign-in">
          <p>
            On your first sign-in you will see the dashboard with all stats at zero and a
            setup checklist.
          </p>
          <p className="font-medium text-white">Recommended setup order:</p>
          <StepList steps={[
            'Go to Settings → upload your logo and pick your portal colors',
            'Write the welcome message and the label for your loyalty currency',
            'Set your Region: country, phone prefix and timezone',
            'Create at least one loyalty Program',
            'Add Rewards to the program (Starter plan and up)',
            'Register your first Customers',
            'Share the portal URL with your customers',
          ]} />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Open a browser → go to fideliza.app/auth/register',
            'Complete Step 1: name, email, password (show the strength meter), accept terms',
            'Click Continue → Step 2 appears',
            'Type the business name → show the subdomain being generated automatically',
            'Manually edit the subdomain → show the availability message',
            'Click Create account → show the "Check your email" screen',
            'Open the email → click the link → show the empty dashboard with stats at zero',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 3. Navigation ─ */}
      <Section id="navegacion" title="3. Navigating the system">
        <p>The sidebar is split into three groups.</p>

        <p className="font-medium text-white pt-2">Operations</p>
        <DataTable
          headers={['Section', 'URL', 'What it holds']}
          rows={[
            ['Overview',       '/dashboard',       'Stats, recent activity, quick links'],
            ['Quick register', '/dashboard/quick', 'Fast mode for logging activity in store'],
          ]}
        />

        <p className="font-medium text-white pt-4">Management</p>
        <DataTable
          headers={['Section', 'URL', 'What it holds', 'Plan']}
          rows={[
            ['Customers',       '/dashboard/customers',      'List, search, customer creation',              'All'],
            ['Customer detail', '/dashboard/customers/[id]', 'History, enrollments, vouchers, missions',     'All'],
            ['Programs',        '/dashboard/programs',       'List of loyalty programs',                     'All'],
            ['Program detail',  '/dashboard/programs/[id]',  'Rewards, transactions, flash offers, missions, Special Surprise', 'All'],
            ['Referrals',       '/dashboard/referidos',      'Referral program and its stats',               'Pro'],
            ['VIP tiers',       '/dashboard/tiers',          'Bronze, Silver and Gold tiers with multipliers','Pro'],
            ['Bonuses',         '/dashboard/bonos',          'Birthday and win-back bonuses',                'Pro'],
            ['Analytics',       '/dashboard/analytics',      'Retention, frequency, at-risk customers',      'Pro'],
          ]}
        />

        <p className="font-medium text-white pt-4">Account</p>
        <DataTable
          headers={['Section', 'URL', 'What it holds']}
          rows={[
            ['Support',  '/dashboard/soporte',  'Ticket submission and team replies'],
            ['Settings', '/dashboard/settings', 'Logo, branding, region, portal, language, notifications, billing'],
          ]}
        />

        <Note>
          Pro-only sections are visible on every plan, but show a sample view with an upgrade
          notice until you subscribe.
        </Note>
      </Section>

      {/* ─ 4.1 Overview ─ */}
      <Section id="dashboard" title="4.1 Overview">
        <p>A real-time snapshot of the business.</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {([
            ['Active customers', 'Total customers in active status'],
            ['Active programs',  'Programs in "active" status'],
            ['Transactions today','Activity logged during the day'],
            ['Pending vouchers', 'Issued rewards not yet redeemed'],
          ] as [string, string][]).map(([t, d]) => (
            <div key={t} className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <p className="font-medium text-white text-sm">{t}</p>
              <p className="text-gray-400 text-xs mt-0.5">{d}</p>
            </div>
          ))}
        </div>
        <ul className="list-disc pl-5 space-y-1 pt-2">
          <li><strong className="text-white">Setup checklist</strong> — create your first program, add your first customer, log your first transaction</li>
          <li><strong className="text-white">Recent activity</strong> — the latest transactions in the system</li>
          <li><strong className="text-white">Active programs</strong> — direct access to running programs</li>
          <li><strong className="text-white">Customer portal URL</strong> — a link ready to share</li>
          <li><strong className="text-white">CSV export</strong> (Pro only) — download the full history</li>
        </ul>
        <GuiddeBox>
          <StepList steps={[
            'Sign in → show the 4 stat cards',
            'Show the setup checklist',
            'Scroll down → show the recent activity section',
            'Show the active programs',
            'Point at the customer portal URL and copy it',
            '(Pro plan) Show the CSV export button',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.2 Quick register ─ */}
      <Section id="registro-rapido" title="4.2 Quick register">
        <p>
          A fast-entry mode built for staff working the counter.
          Available at <Code>/dashboard/quick</Code>.
        </p>
        <StepList steps={[
          'Go to Quick register in the sidebar',
          'Enter the customer access code',
          'The system loads the customer and their active enrollments automatically',
          'Pick the program and log the transaction',
          'Confirm — the transaction is recorded immediately',
        ]} />
        <GuiddeBox>
          <StepList steps={[
            'Go to Quick register from the menu',
            'Type an existing customer access code',
            'Show how the customer data and programs load',
            'Pick the program → enter the amount or action',
            'Confirm → show the on-screen confirmation',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.3 Customers ─ */}
      <Section id="clientes" title="4.3 Customers">
        <p>
          Register, search and manage the business&apos;s customers. The table shows name,
          access code, phone, status, registration date and a link to the detail view.
        </p>

        <SubSection id="crear-cliente" title="Create a customer">
          <StepList steps={[
            'Go to Customers in the sidebar',
            'Click Add customer',
            'Name (required, max 150 characters)',
            'Phone (optional — pre-filled with your Region prefix)',
            'Internal notes (optional, max 500 characters — not visible to the customer)',
            'WhatsApp notifications: tick the box if the customer agrees to receive notices',
            'Click Save',
          ]} />
          <Note>
            A unique access code is generated automatically, in the format{' '}
            <Code>XXXXX-XXXXX</Code> (10 characters, no ambiguous letters or digits). That
            code is the customer&apos;s identity in the portal — no password involved.
          </Note>
          <p>
            From the customer record you can use <strong className="text-white">Share access</strong>{' '}
            to send them their personal link over WhatsApp, code already included.
          </p>
        </SubSection>

        <SubSection id="detalle-cliente" title="View a customer detail">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Header:</strong> name, status, access code, phone, VIP tier, date, notes, activate/deactivate button</li>
            <li><strong className="text-white">Enrollments:</strong> every program they joined, current balance and lifetime total</li>
            <li><strong className="text-white">Vouchers:</strong> code, reward name, status, expiry</li>
            <li><strong className="text-white">Missions:</strong> the customer&apos;s active challenges, their progress and the +1 progress button (Pro plan)</li>
            <li><strong className="text-white">Transaction history:</strong> type, delta, resulting balance, note, date</li>
          </ul>
          <DataTable
            headers={['Type', 'Icon', 'Description']}
            rows={[
              ['Earn',   '➕', 'Points, stamps or visits accrued'],
              ['Redeem', '🎁', 'Reward issued as a voucher'],
              ['Adjust', '✏️', 'Manual balance correction'],
              ['Expire', '⏰', 'Points expired automatically'],
              ['Refund', '↩️', 'Points returned'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to Customers → show the list',
            'Click Add customer',
            'Fill in: name "Ana García", phone "+52 55 9876 5432", notes "Regular"',
            'Click Save → show the customer in the list with their generated access code',
            'Click View → show the full profile',
            'Show the sections: Enrollments, Vouchers, Missions, History',
            'Click Share access → show the WhatsApp message with the link',
            'Click the status button → show the active/inactive change',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.4 Programs ─ */}
      <Section id="programas" title="4.4 Loyalty programs">
        <DataTable
          headers={['Type', 'Icon', 'Description', 'Required config']}
          rows={[
            ['Points',   '⭐', 'Accrue points per spend',        'Points per purchase unit · Minimum to redeem'],
            ['Stamps',   '🎟️', 'Digital stamp card',             'Stamps per card'],
            ['Visits',   '📍', 'Reward for visit frequency',     'Visits required'],
            ['Cashback', '💰', 'Percentage back on the purchase','Cashback % · Minimum purchase (opt.)'],
          ]}
        />
        <Note>Available types depend on your plan. See section 7.</Note>

        <SubSection id="crear-programa" title="Create a program">
          <StepList steps={[
            'Go to Programs in the sidebar',
            'Click Add program',
            'Name (2–150 characters)',
            'Description (optional, max 500 characters)',
            'Pick the type (Points, Stamps, Visits or Cashback)',
            'Fill in the config specific to the chosen type',
            'Maximum enrollments (optional — blank = unlimited)',
            'Start and end date (optional — end must be after start)',
            'Click Create',
          ]} />
        </SubSection>

        <SubSection id="estados-programa" title="Program states">
          <InlineCode>Draft → Active → Paused → Archived</InlineCode>
          <DataTable
            headers={['State', 'Description']}
            rows={[
              ['Draft',    'Admin-only. Customers cannot see it.'],
              ['Active',   'Customers can enroll and accrue.'],
              ['Paused',   'Temporarily rejects new transactions.'],
              ['Archived', 'Finished. Historical reference only.'],
            ]}
          />
        </SubSection>

        <SubSection id="ofertas-flash" title="Flash offers">
          <p>
            From each program detail you can switch on a{' '}
            <strong className="text-white">flash offer</strong>: a window of the day where
            customers accrue with a multiplier. Use it to fill your dead hours.
          </p>
          <StepList steps={[
            'Open the program detail',
            'Turn the flash offer on',
            'Set the multiplier (e.g. 2×)',
            'Set the start hour and end hour',
            'Save — the customer portal shows a banner while the offer is live',
          ]} />
          <Note>Available from the Starter plan.</Note>
        </SubSection>

        <SubSection id="impulso-inicial" title="Head start">
          <p>
            You can grant a starting balance when a customer enrolls, so they do not begin at
            zero. Someone already holding 2 of 10 stamps comes back more often than someone
            with an empty card.
          </p>
          <Note>Available from the Starter plan.</Note>
        </SubSection>

        <SubSection id="misiones" title="Missions">
          <Note>Pro plan only.</Note>
          <p>
            A <strong className="text-white">mission</strong> is a challenge with a prize:
            the customer has to reach a target, and gets a bonus when they do. They are
            created per program, from the <strong className="text-white">Missions</strong>{' '}
            card on the program detail.
          </p>
          <StepList steps={[
            'Open the program detail → Missions card → New mission',
            'Mission title (required, max 80 characters)',
            'What should the customer do? (optional, max 120 characters — this is what they read)',
            'Target: how many times they have to do it (1 to 999)',
            'Bonus: what they get for completing it',
            'Deadline (optional)',
            'Click Create mission',
          ]} />
          <p>
            The bonus is expressed in the program&apos;s own unit: points, stamps, visits or a
            cash bonus, depending on the type.
          </p>

          <p className="font-medium text-white pt-2">How progress advances</p>
          <p>
            Every <strong className="text-white">Earn</strong> transaction in that program
            adds <strong className="text-white">+1</strong> to all of the customer&apos;s
            active missions. You do not have to do anything: staff log the visit as usual and
            progress moves on its own.
          </p>
          <p>
            If you need to credit progress by hand — the customer did something that does not
            go through the register, say — open their record, find the{' '}
            <strong className="text-white">Missions</strong> card and use the{' '}
            <strong className="text-white">+1 progress</strong> button.
          </p>

          <p className="font-medium text-white pt-2">On completion</p>
          <StepList steps={[
            'The mission is marked complete and stops counting',
            'The bonus is credited automatically as an Earn transaction, noted "Misión completada: [title]"',
            'The customer gets a WhatsApp letting them know (if they have a phone on file and opted in)',
          ]} />

          <Note>
            Customers see their missions and progress bar in the portal, on the Points tab. A
            mission outside its date window stops advancing.
          </Note>
        </SubSection>

        <SubSection id="sorpresa-especial" title="Special Surprise">
          <Note>Pro plan only.</Note>
          <p>
            On every visit there is a chance the customer gets extra points out of nowhere.
            They never know when it will happen, and that is exactly what makes it work: it
            turns every visit into a roll of the dice.
          </p>
          <StepList steps={[
            'Open the program detail → Special Surprise card',
            'Flip the switch on',
            'Pick the per-visit probability: 5%, 10%, 15% or 20%',
            'Pick the multiplier: 1.5×, 2× or 3×',
            'Click Save',
          ]} />
          <p>
            The card shows you live what your settings mean — for example,{' '}
            <strong className="text-white">1 in every 10 visits will pay 2× points</strong>.
          </p>
          <p className="font-medium text-white pt-2">When a surprise lands</p>
          <StepList steps={[
            'Whatever the customer was about to earn on that transaction gets multiplied',
            'The transaction is tagged "🎲 Surprise 2×", so the history shows why the balance jumped',
            'The customer gets a WhatsApp telling them about their luck',
          ]} />
          <Note>
            On <strong>Stamps</strong> and <strong>Visits</strong> programs the 1.5×
            multiplier is not offered: those units are whole numbers and half a stamp does
            not exist.
          </Note>
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to Programs → show the list',
            'Click Add program',
            'Name: "Coffee Points", type: Points',
            'Enter the accrual config and the minimum to redeem',
            'Click Create → show the card in the list (state: Draft)',
            'Click the card → open the detail',
            'Click Activate → show the state changed to "Active"',
            'Turn on a 2× flash offer between 3 and 6 pm → save',
            'Create a mission: "Coffee challenge", target 5, bonus 100 → show it in the list',
            'Turn on Special Surprise at 10% and 2× → show the "1 in every 10 visits" preview',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.5 Rewards ─ */}
      <Section id="recompensas" title="4.5 Rewards">
        <Note>
          Available from the Starter plan. The Free plan has no reward catalog. Starter
          allows 3 <strong>active</strong> rewards per program; Pro allows 5. Deactivated
          rewards do not count toward the limit.
        </Note>

        <SubSection id="crear-recompensa" title="Create a reward">
          <StepList steps={[
            'Go to Programs → pick the program',
            'In the Rewards section, click Add reward',
            'Name (required, 2–150 characters)',
            'Description (optional, max 500 characters)',
            'Image (optional — HTTPS URL)',
            'Point cost (required — positive integer)',
            'Stock (optional — blank = unlimited)',
            'Voucher expiry in days (optional)',
            'Click Save',
          ]} />
        </SubSection>

        <SubSection id="verificar-voucher" title="Verify a voucher at the counter">
          <StepList steps={[
            'Open the relevant program detail',
            'In the Verify voucher section, enter the code the customer shows you',
            'The system checks the voucher is pending and not expired',
            'Confirm the redemption',
          ]} />
          <p>
            Voucher codes follow the format <Code>XXXX-XXX-XXX</Code> and open with four
            letters derived from your business name, so staff can tell at a glance that the
            voucher is yours.
          </p>
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to an active program → Rewards section',
            'Click Add reward',
            'Name: "Free coffee", cost: 100 points, stock: 50',
            'Click Save → show the reward in the table',
            'Scroll to Verify voucher → type a sample code',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.6 Referrals ─ */}
      <Section id="referidos" title="4.6 Referrals">
        <Note>Pro plan only.</Note>
        <p>
          Turn existing customers into promoters: each one gets a 6-character referral code
          to share. When someone signs up with that code, both sides receive a bonus.
        </p>

        <SubSection id="activar-referidos" title="Turn on the referral program">
          <StepList steps={[
            'Go to Referrals in the sidebar',
            'Flip the referral program switch on',
            'Choose which programs it applies to, and how much the referrer and the referee each get',
            'Save',
          ]} />
        </SubSection>

        <SubSection id="referidos-flujo" title="What the customer experiences">
          <StepList steps={[
            'The customer opens their portal and copies their referral link',
            'They share it over WhatsApp with someone they know',
            'The new customer opens [yourshop].fideliza.app/c/refer?code=XXXXXX and signs up',
            'The referral sits in "pending" status',
            'Once the new customer meets the condition it flips to "completed" and both bonuses are credited',
          ]} />
        </SubSection>

        <p>
          The Referrals screen shows how many are pending, how many completed, and the top 5
          customers who refer the most.
        </p>

        <GuiddeBox>
          <StepList steps={[
            'Go to Referrals → show the switch turned off',
            'Turn it on → show the per-program bonus config',
            'Save',
            'Open a customer portal → show their referral link',
            'Back to Referrals → show the pending and completed stats',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.7 VIP tiers ─ */}
      <Section id="niveles" title="4.7 VIP tiers">
        <Note>Pro plan only.</Note>
        <p>
          A three-tier system that rewards your best customers with an accrual multiplier.
          The tier is computed <strong className="text-white">universally</strong>: it sums
          every interaction the customer had, regardless of which program it happened in.
        </p>
        <DataTable
          headers={['Tier', 'Medal', 'What it does']}
          rows={[
            ['Bronze', '🥉', 'Entry tier — everyone starts here'],
            ['Silver', '🥈', 'Configurable accrual multiplier'],
            ['Gold',   '🥇', 'The highest multiplier you define'],
          ]}
        />
        <p>
          You can configure how much each type of interaction scores, set a rolling window
          (for example, &quot;only the last 12 months count&quot;) and a grandfather date so
          nobody gets demoted the moment you turn the system on.
        </p>
        <p>
          Each tier card shows how many customers sit in it, and clicking through takes you
          to the customer list filtered by that tier.
        </p>

        <GuiddeBox>
          <StepList steps={[
            'Go to VIP tiers → show the three cards with the current distribution',
            'Show the per-interaction scoring config',
            'Adjust the Gold tier multiplier',
            'Set the rolling window to 12 months',
            'Save → click the Gold card to see the customers in that tier',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.8 Bonuses ─ */}
      <Section id="bonos" title="4.8 Loyalty bonuses">
        <Note>Pro plan only.</Note>
        <p>
          Automatic campaigns that gift balance to bring a customer back. The bonus is
          announced over WhatsApp and credited when the customer actually returns.
        </p>
        <DataTable
          headers={['Campaign', 'When it fires']}
          rows={[
            ['Birthday', "On the customer's registered birthday"],
            ['Win-back', 'When a customer has not returned in a while'],
          ]}
        />
        <p>
          For each campaign you set how many points, stamps or visits are gifted and how many
          days the bonus lasts before it expires.
        </p>
        <Note>
          The bonus is not credited when it is sent: it is held in reserve and applied on the
          customer&apos;s next visit. The screen lists unclaimed bonuses with their expiry date.
        </Note>

        <GuiddeBox>
          <StepList steps={[
            'Go to Bonuses → show the two campaigns',
            'Configure the birthday bonus: 50 points, valid 30 days',
            'Configure the win-back bonus',
            'Save → show the table of unclaimed bonuses',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.9 Analytics ─ */}
      <Section id="analiticas" title="4.9 Analytics">
        <Note>Pro plan only.</Note>
        <p>Four retention indicators plus charts of how things are moving.</p>
        <DataTable
          headers={['Indicator', 'What it measures']}
          rows={[
            ['Retention rate',        'What share of your customers is still active'],
            ['Average visits / customer','How often an active customer comes back'],
            ['Value per redemption',  'Average points spent per redemption'],
            ['At-risk customers',     'How many have had no activity in 30 days'],
          ]}
        />
        <ul className="list-disc pl-5 space-y-1 pt-2">
          <li><strong className="text-white">Customer growth</strong> — cumulative enrollments and transactions per period</li>
          <li><strong className="text-white">Redemptions per period</strong> — how many rewards were claimed</li>
          <li><strong className="text-white">Top customers</strong> — ranked by lifetime points</li>
        </ul>

        <GuiddeBox>
          <StepList steps={[
            'Go to Analytics → show the four indicator cards',
            'Point out the trend arrow against the previous period',
            'Change the period → show the charts recalculating',
            'Scroll down → show the top customers ranking',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.10 Customer portal ─ */}
      <Section id="portal-cliente" title="4.10 Customer portal">
        <p>
          The end-customer interface. They sign in without a password using their access code
          at <Code>[subdomain].fideliza.app/c</Code>.
        </p>
        <Note>
          The URL can carry the code directly: <Code>?code=XXXXX-XXXXX</Code> — that is what
          the Share access button sends from the customer record.
        </Note>

        <SubSection id="portal-tabs" title="The portal&apos;s 4 tabs">
          <div className="space-y-3">
            {([
              ['⭐ Points',  'Pending vouchers · Enrollment cards with balance, progress, stamps or visit counter · Active missions with their progress bar · Flash offer banner while one is live'],
              ['🎁 Rewards', 'Reward catalog · Progress bar · Enough-points indicator · Redeem button'],
              ['📋 History', 'Recent transactions with icon, type, delta and date'],
              ['🏆 Ranking', "The customer's position in the monthly ranking"],
            ] as [string, string][]).map(([title, desc]) => (
              <div key={title} className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <Note>
          On the Free plan the portal works, but carries Fideliza branding (default colors,
          no logo of yours, and a &quot;Powered by Fideliza&quot; badge). From Starter up, the
          portal uses your logo and your colors.
        </Note>

        <GuiddeBox>
          <StepList steps={[
            'Open an incognito tab (to simulate the customer view)',
            'Navigate to [subdomain].fideliza.app/c',
            'Enter a valid access code → show the portal loading',
            'Points tab: enrollment cards and progress',
            'Rewards tab: catalog, progress bar, click Redeem → voucher generated',
            'History tab: transaction list',
            'Ranking tab: the customer position for the month',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.11 Settings ─ */}
      <Section id="configuracion" title="4.11 Settings & branding">
        <p>Settings is split into independent sections.</p>
        <DataTable
          headers={['Section', 'What you configure']}
          rows={[
            ['Account',        'Business name, subdomain and portal URL (with copy and open buttons)'],
            ['Business logo',  'Upload your logo and frame it with zoom. JPG, PNG or WebP · max 2 MB'],
            ['Appearance',     'Primary and secondary portal colors, with a live preview'],
            ['Region',         'Country and phone prefix, timezone and currency'],
            ['Customer portal','Welcome message and the label for your loyalty currency'],
            ['Language',       'Dashboard language (Español / English)'],
            ['Notifications',  'Which emails you want to receive'],
            ['WhatsApp',       'The number your customer messages are sent from'],
            ['Billing',        'Current plan, upgrade and payment method'],
          ]}
        />

        <SubSection id="config-region" title="Region">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Country / phone prefix</strong> — when you add a customer, the phone field already carries this prefix</li>
            <li><strong className="text-white">Timezone</strong> — every date and time in the dashboard is shown in this zone</li>
            <li><strong className="text-white">Currency</strong> — the symbol shown on purchase amounts in cashback programs</li>
          </ul>
        </SubSection>

        <SubSection id="config-notificaciones" title="Email notifications">
          <DataTable
            headers={['Notification', 'When it arrives']}
            rows={[
              ['New customer',     'When someone joins your loyalty program'],
              ['Reward redemption','When a customer redeems a reward'],
              ['Weekly digest',    'Every Monday, summarizing the week'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to Settings from the menu',
            'Upload the business logo → adjust the framing with zoom → Save',
            'Change the primary color → show the live preview',
            'Write a welcome message: "Thanks for stopping by!"',
            'Change the currency label to "Stars"',
            'Set Region: Mexico, +52, timezone and currency',
            'Click Save changes',
            'Open the customer portal in another tab → verify the changes applied',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.12 Support ─ */}
      <Section id="soporte" title="4.12 Support">
        <p>
          From <Code>/dashboard/soporte</Code> you can open a ticket with the Fideliza team
          without leaving the dashboard.
        </p>
        <StepList steps={[
          'Go to Support in the sidebar',
          'Under New ticket, write the subject and the message',
          'Send',
          'The team reply shows up in the ticket history, below your message',
        ]} />
        <Note>
          On the Pro plan the section is called <strong>Priority support</strong> and your
          tickets are handled ahead of everyone else&apos;s.
        </Note>
      </Section>

      {/* ─ 5. WhatsApp ─ */}
      <Section id="whatsapp" title="5. WhatsApp messages">
        <p>
          Fideliza sends automatic WhatsApp notices to your customers. You do not write or
          schedule anything — messages go out on their own when the event happens.
        </p>
        <DataTable
          headers={['Notice', 'When it goes out']}
          rows={[
            ['Welcome',         'When the customer is registered, carrying their access code'],
            ['Close to a reward','When the customer is nearly able to redeem'],
            ['Voucher expiring','Before an unredeemed voucher expires'],
            ['Birthday',        'On their birthday, with the gift bonus (Pro)'],
            ['Streak at risk',  'When they are about to lose their visit streak (Pro)'],
            ['Win-back',        'When they have not returned in a while (Pro)'],
          ]}
        />
        <DataTable
          headers={['Plan', 'Messages per month', 'Promotional messages']}
          rows={[
            ['Free',    'Not included', '✗'],
            ['Starter', '500',          '✗'],
            ['Pro',     '3,000',        '✓'],
          ]}
        />
        <Note>
          Messages go out from the official Fideliza number. Connecting your own WhatsApp
          Business number is on the way — we will let you know when it lands.
        </Note>
        <p>
          Two things are required for a customer to receive any of this:{' '}
          <strong className="text-white">a phone number on file</strong> and the{' '}
          <strong className="text-white">WhatsApp notifications</strong> box ticked on their
          record. That box is <strong className="text-white">off by default</strong>: it is
          the customer&apos;s consent, not your preference, so you have to ask for it and tick
          it when you register them.
        </p>
      </Section>

      {/* ─ 6. Billing ─ */}
      <Section id="facturacion" title="6. Billing & plans">
        <p>
          From <strong className="text-white">Settings → Billing</strong> you can see your
          current plan, upgrade, and manage your payment method. Payments are handled by
          Stripe. <strong className="text-indigo-400 font-bold">Fideliza</strong> never
          stores card data.
        </p>
        <Note>
          If a payment fails or the subscription is canceled, Free plan restrictions apply
          until payment is sorted out. Existing data is kept.
        </Note>
        <GuiddeBox>
          <StepList steps={[
            'Go to Settings → Billing section',
            'Show the current plan and its limits',
            'Click upgrade → show the cost preview',
            'Show the redirect to Stripe Checkout (without completing payment)',
            'Come back → show the "Manage payment method" button',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 7. Plans ─ */}
      <Section id="planes" title="7. Plans & limits">
        <p className="font-medium text-white">Limits</p>
        <DataTable
          headers={['Feature', 'Free', 'Starter', 'Pro']}
          rows={[
            ['Maximum customers',     '50',              'Unlimited',                 'Unlimited'],
            ['Maximum programs',      '1',               '3',                         'Unlimited'],
            ['Active rewards per program','No catalog',  '3',                         '5'],
            ['Program types',         'Points, Stamps',  'Points, Stamps, Visits',    'Points, Stamps, Visits, Cashback'],
            ['Transaction history',   'Last 50',         'Unlimited',                 'Unlimited'],
            ['WhatsApp messages / mo','Not included',    '500',                       '3,000'],
          ]}
        />

        <p className="font-medium text-white pt-4">Features</p>
        <DataTable
          headers={['Feature', 'Free', 'Starter', 'Pro']}
          rows={[
            ['Customer portal',        '✓ (Fideliza branding)', '✓ (your branding)', '✓ (your branding)'],
            ['Reward catalog',         '✗', '✓', '✓'],
            ['Flash offers',           '✗', '✓', '✓'],
            ['Head start',             '✗', '✓', '✓'],
            ['Promotional WhatsApp',   '✗', '✗', '✓'],
            ['Birthday & win-back bonuses','✗', '✗', '✓'],
            ['VIP tiers',              '✗', '✗', '✓'],
            ['Special Surprise',       '✗', '✗', '✓'],
            ['Referral program',       '✗', '✗', '✓'],
            ['Missions',               '✗', '✗', '✓'],
            ['Analytics',              '✗', '✗', '✓'],
            ['CSV export',             '✗', '✗', '✓'],
            ['Priority support',       '✗', '✗', '✓'],
          ]}
        />

        <Note>
          If a payment fails or the subscription is canceled, Free plan restrictions apply.
          Existing data is kept.
        </Note>
      </Section>

      {/* ─ 8. Errors ─ */}
      <Section id="errores" title="8. Errors & validations">
        <p className="font-medium text-white">Customers</p>
        <DataTable
          headers={['Error', 'Cause', 'Fix']}
          rows={[
            ['A customer with this phone number already exists', 'The phone is already registered', 'Check whether the customer is already in the list'],
            ['Your [X] plan allows a maximum of [N] active customers', 'Plan limit reached', 'Deactivate inactive customers or upgrade the plan'],
          ]}
        />
        <p className="font-medium text-white mt-4">Programs</p>
        <DataTable
          headers={['Error', 'Cause', 'Fix']}
          rows={[
            ['Your [X] plan allows a maximum of [N] programs', 'Plan limit reached', 'Upgrade the plan from Settings'],
            ['Type "[type]" is not available on the [X] plan', 'Type not included in the plan', 'Upgrade the plan'],
            ['The end date must be after the start date', 'Dates inverted', 'Fix the dates'],
          ]}
        />
        <p className="font-medium text-white mt-4">Transactions</p>
        <DataTable
          headers={['Error', 'Cause', 'Fix']}
          rows={[
            ['Customer not found or inactive', 'The customer does not exist or is deactivated', 'Check the customer in the list'],
            ['Program not found or not active', 'The program is paused or archived', 'Set the program state back to Active'],
            ['Adjustment would result in a negative balance', 'The adjustment exceeds the balance', 'Enter a smaller adjustment'],
            ['Customer must be enrolled in this program first', 'Customer not enrolled', 'Enroll the customer in the program'],
          ]}
        />
        <p className="font-medium text-white mt-4">Redemptions</p>
        <DataTable
          headers={['Error', 'Cause', 'Fix']}
          rows={[
            ['Limit reached: maximum [N] active rewards per program', 'Plan limit reached', 'Deactivate a reward you no longer use, or upgrade the plan'],
            ['Reward is out of stock', 'The reward ran out of stock', 'Update the stock or deactivate the reward'],
            ['[customer] does not have enough [label] to redeem', 'Insufficient balance', 'The customer needs to keep accruing'],
            ['Redemption code not found', 'The voucher code does not exist', 'Check the code was typed correctly'],
            ['Redemption voucher has expired', 'The voucher expired', 'The customer needs to request a new one'],
            ['Redemption is not pending', 'The voucher was already used or canceled', 'The voucher is not valid for redemption'],
          ]}
        />
        <p className="font-medium text-white mt-4">Customer portal</p>
        <DataTable
          headers={['Error', 'Cause', 'Fix']}
          rows={[
            ['Code not found. Check it and try again.', 'The access code is wrong', 'Verify the code in the admin dashboard'],
          ]}
        />
        <Note>
          Exact wording may vary. What matters is the cause: if the message mentions a limit,
          it is your plan; if it mentions the customer or the program, check their state.
        </Note>
      </Section>

      {/* ─ 9. Best practices ─ */}
      <Section id="buenas-practicas" title="9. Best practices">
        <div className="space-y-5">
          {([
            ['Initial setup', [
              'Upload your logo and set your colors before launching the portal. Customers see your brand from their very first visit.',
              'Write a welcome message. It shows in the portal and improves the experience.',
              'Customize your currency label: "Stars", "Beans", "Miles".',
              'Set your Region before adding customers: the phone prefix and timezone affect everything downstream.',
            ]],
            ['Managing programs', [
              'Start with a single program. Easier to communicate and to scale.',
              'Use the Draft state to prepare a program before launching it.',
              'Do not delete programs. Use Archived to keep the history.',
              'Use flash offers to fill dead hours, not peak hours.',
            ]],
            ['Managing customers', [
              'Always capture the phone number and tick the notifications box: without both, the customer receives no WhatsApp notices at all.',
              'Ask for consent out loud when registering them ("want your points over WhatsApp?"). Ticking the box without asking is what gets your messages reported as spam.',
              'Use internal notes to record special preferences.',
              'Do not deactivate customers without reason — they lose portal access.',
              'Use Share access to send the customer their link with the code already in it.',
            ]],
            ['Rewards', [
              'Set stock on physical rewards to avoid over-issuing.',
              'Use expiry days to create urgency (e.g. 30 days).',
              'Deactivate rewards rather than deleting them.',
            ]],
            ['Retention (Pro plan)', [
              'Turn on win-back bonuses before any other campaign: recovering a customer costs less than acquiring one.',
              "Capture your customers' birthdays — without them the birthday bonus never fires.",
              'Check Analytics → At-risk customers once a week.',
              'With missions, set targets reachable in weeks, not months: a 20-visit target discourages more than it motivates.',
              'Start Special Surprise at 10% and 2×. Push it too high and it stops being a surprise — it just becomes the normal rate.',
            ]],
            ['Daily operations', [
              'Use Quick register in store to speed up service.',
              'Check the Overview at the start of the day.',
              'Export the CSV monthly (Pro plan) as a backup.',
            ]],
          ] as [string, string[]][]).map(([title, items]) => (
            <div key={title}>
              <p className="font-semibold text-white mb-2">{title}</p>
              <ul className="list-disc pl-5 space-y-1.5 text-gray-300">
                {items.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* ─ 10. FAQ ─ */}
      <Section id="faq" title="10. Frequently asked questions">
        <div className="space-y-4">
          {([
            ['Do customers need to install an app?',
             'No. The portal is a website that runs in any browser. Nothing to install.'],
            ['How does the customer get their access code?',
             'You hand it to them when you register them. It appears in the customer list and on their detail record, and from there you can send it over WhatsApp with the Share access button.'],
            ['Can a customer lose their points if they lose the code?',
             'No. You can look the customer up by name or phone, retrieve their code and share it again.'],
            ['Can I run several businesses from one account?',
             'No. Each account belongs to a single business. Multiple businesses need separate accounts.'],
            ['Can transactions be deleted?',
             'No. History is immutable. If something is wrong, log an Adjust transaction.'],
            ["Can a customer see other customers' data?",
             'Only their position in the monthly ranking. No other customer data is visible.'],
            ['What are "pending vouchers"?',
             'Rewards the customer already redeemed in the portal but that have not yet been verified in person at the counter.'],
            ['When do vouchers expire?',
             'It depends on the reward configuration. With no expiry configured, the voucher does not expire.'],
            ['Can I pause a program without losing data?',
             'Yes. The Paused state stops new transactions but keeps every balance and all history.'],
            ['What happens when I change plan?',
             'Upgrading makes features available immediately. Downgrading (or a payment problem) applies Free plan restrictions, but your data is kept.'],
            ['Do I have to write the WhatsApp messages myself?',
             "No. The notices are automatic and go out on their own when the event happens. All you need is the customer's phone number on file."],
            ['Can I use my own WhatsApp number?',
             'Not yet. Today messages go out from the official Fideliza number. Connecting your own WhatsApp Business number is on the way.'],
            ['Do I have to tick mission progress by hand?',
             'No. Every Earn transaction adds +1 to all active missions on that program. The "+1 progress" button on the customer record is only for things that never go through the register.'],
            ['How many missions can I run at once?',
             'There is no limit. Keep in mind a single charge advances every active mission on that program at the same time, so simultaneous missions complete in parallel.'],
            ['Do I have to tell the customer when they finish a mission or get a surprise?',
             'No. Both send an automatic WhatsApp, as long as the customer has a phone number and the notifications box ticked.'],
            ['Why can I not pick 1.5× for Special Surprise?',
             'Because your program is stamps or visits, and those units are whole numbers. Half a stamp does not exist. Points and cashback programs do offer 1.5×.'],
            ['How do I know a high balance came from a surprise and not a mistake?',
             'The transaction is tagged "🎲 Surprise 2×" in the customer history. Missions are tagged "Misión completada: [title]".'],
            ['Why do I see sections I cannot use?',
             'Referrals, VIP tiers, Bonuses and Analytics are Pro features. They are shown with sample data so you can see what they do before deciding whether you need them.'],
            ['Does the portal carry my branding on the Free plan?',
             'No. On Free the portal uses Fideliza default colors and carries a "Powered by Fideliza" badge. From Starter up it shows your logo and your colors.'],
          ] as [string, string][]).map(([q, a]) => (
            <div key={q} className="border-b border-white/5 pb-4 last:border-0">
              <p className="font-medium text-white mb-1">{q}</p>
              <p className="text-gray-400 text-sm">{a}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
