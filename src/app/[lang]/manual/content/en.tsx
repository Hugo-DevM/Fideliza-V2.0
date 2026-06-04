import {
  Section, SubSection, GuiddeBox, DataTable, StepList, Note, Code, InlineCode,
} from '../components';

export const tocEn = [
  { id: 'introduccion',    label: '1. Introduction' },
  { id: 'primeros-pasos',  label: '2. Getting started' },
  { id: 'navegacion',      label: '3. Navigation' },
  { id: 'dashboard',       label: '4.1 Dashboard' },
  { id: 'clientes',        label: '4.2 Customers' },
  { id: 'programas',       label: '4.3 Programs' },
  { id: 'recompensas',     label: '4.4 Rewards' },
  { id: 'portal-cliente',  label: '4.5 Customer portal' },
  { id: 'configuracion',   label: '4.6 Settings & branding' },
  { id: 'facturacion',     label: '4.7 Billing' },
  { id: 'registro-rapido', label: '4.8 Quick register' },
  { id: 'planes',          label: '5. Plans' },
  { id: 'errores',         label: '6. Errors & validations' },
  { id: 'buenas-practicas',label: '7. Best practices' },
  { id: 'faq',             label: '8. FAQ' },
];

export function ContentEn() {
  return (
    <>
      {/* ─ 1. Introduction ─ */}
      <Section id="introduccion" title="1. Introduction">
        <p>
          <strong className="text-indigo-400 font-bold">Fideliza</strong> is a multi-tenant loyalty SaaS
          platform. It lets businesses create and manage loyalty programs without mobile apps
          or special hardware.
        </p>
        <DataTable
          headers={['Actor', 'How they access', 'URL']}
          rows={[
            ['Business (admin)', 'Email + password or magic link', 'app.fideliza.app/auth/login'],
            ['Customer',         'Access code (no password)',       '[yourbusiness].fideliza.app/c'],
          ]}
        />
        <Note>
          Each business gets its own subdomain. For example:{' '}
          <Code>coffee-shop.fideliza.app</Code>. Data from each business is fully isolated
          from all others.
        </Note>
      </Section>

      {/* ─ 2. Getting started ─ */}
      <Section id="primeros-pasos" title="2. Getting started">
        <SubSection id="registro" title="2.1 Create an account">
          <p>Registration has <strong className="text-white">2 steps</strong>:</p>

          <p className="font-medium text-white">Step 1 — Account details</p>
          <StepList steps={[
            'Go to app.fideliza.app/auth/register',
            'Enter your full name',
            'Enter your email address',
            'Create a password (minimum 8 characters) — the system shows a strength indicator',
            'Confirm your password',
            'Accept the Terms of Service and Privacy Policy',
            'Click Continue',
          ]} />

          <p className="font-medium text-white pt-2">Step 2 — Business details</p>
          <StepList steps={[
            'Enter your business name',
            'The system automatically suggests a subdomain (e.g. coffee-shop)',
            'You can edit it — the system checks availability in real time',
            'Once available, you\'ll see your portal URL: [subdomain].fideliza.app/c',
            'Click Create account',
          ]} />

          <Note>
            The subdomain must be between 3 and 63 characters, using only lowercase letters,
            numbers and hyphens. It cannot start or end with a hyphen.
          </Note>
        </SubSection>

        <SubSection id="primer-ingreso" title="2.2 First login">
          <p>When you first log in you'll see the dashboard with all stats at zero and suggested actions to get started.</p>
          <p className="font-medium text-white">Recommended setup flow:</p>
          <StepList steps={[
            'Go to Settings → customize your colors and welcome message',
            'Create at least one loyalty Program',
            'Add Rewards to the program',
            'Register your first Customers',
            'Share the portal URL with your customers',
          ]} />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Open browser → go to app.fideliza.app/auth/register',
            'Complete Step 1: name, email, password (show the strength indicator), accept terms',
            'Click Continue → Step 2 appears',
            'Enter business name → show how the subdomain is generated automatically',
            'Manually edit the subdomain → show the availability message',
            'Click Create account → show the empty dashboard with stats at zero',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 3. Navigation ─ */}
      <Section id="navegacion" title="3. System navigation">
        <DataTable
          headers={['Section', 'URL', 'Contents']}
          rows={[
            ['Dashboard',        '/dashboard',                'Stats, recent activity, quick links'],
            ['Customers',        '/dashboard/customers',      'List, search, create customers'],
            ['Customer detail',  '/dashboard/customers/[id]', 'History, enrollments, vouchers'],
            ['Programs',         '/dashboard/programs',       'Loyalty program list'],
            ['Program detail',   '/dashboard/programs/[id]',  'Rewards, transactions, status controls'],
            ['Quick register',   '/dashboard/quick',          'Fast in-store point entry'],
            ['Settings',         '/dashboard/settings',       'Branding, billing, account'],
          ]}
        />
      </Section>

      {/* ─ 4.1 Dashboard ─ */}
      <Section id="dashboard" title="4.1 Main dashboard">
        <p>Shows a real-time summary of your business status.</p>
        <div className="grid sm:grid-cols-2 gap-3 mt-2">
          {([
            ['Active customers',   'Total customers with active status'],
            ['Active programs',    'Programs in "active" state'],
            ['Transactions today', 'Movements recorded today'],
            ['Pending vouchers',   'Issued rewards not yet redeemed at the counter'],
          ] as [string, string][]).map(([t, d]) => (
            <div key={t} className="rounded-lg bg-white/5 border border-white/10 px-4 py-3">
              <p className="font-medium text-white text-sm">{t}</p>
              <p className="text-gray-400 text-xs mt-0.5">{d}</p>
            </div>
          ))}
        </div>
        <ul className="list-disc pl-5 space-y-1 pt-2">
          <li><strong className="text-white">Recent activity</strong> — last 8 transactions across all programs</li>
          <li><strong className="text-white">Active programs</strong> — quick access to running programs</li>
          <li><strong className="text-white">Customer portal URL</strong> — ready-to-share link</li>
          <li><strong className="text-white">CSV export</strong> (Pro plan only) — full transaction history download</li>
        </ul>
        <GuiddeBox>
          <StepList steps={[
            'Log in to the dashboard → show the 4 stat cards',
            'Scroll down → show the recent activity section',
            'Show active programs',
            'Point to the customer portal URL and copy it',
            '(Pro plan) Show the CSV export button and click it',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.2 Customers ─ */}
      <Section id="clientes" title="4.2 Customers">
        <p>
          Register, search and manage your business customers.
          The table shows: name, access code, phone, status, registration date,
          and a link to the detail view.
        </p>

        <SubSection id="crear-cliente" title="Create a customer">
          <StepList steps={[
            'Go to Customers in the sidebar',
            'Click Add customer',
            'Name (required, max 150 characters)',
            'Phone (optional — international format, e.g. +1 555 123 4567)',
            'Internal notes (optional, max 500 characters — not visible to the customer)',
            'Click Save',
          ]} />
          <Note>
            The system automatically generates a unique access code. That code is the
            customer's identifier in the portal — no password needed.
          </Note>
        </SubSection>

        <SubSection id="detalle-cliente" title="View customer detail">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong className="text-white">Header:</strong> name, status, access code, phone, registration date, internal notes, activate/deactivate button</li>
            <li><strong className="text-white">Enrollments:</strong> each program the customer is enrolled in, current balance and lifetime total</li>
            <li><strong className="text-white">Vouchers:</strong> code, reward name, status, expiry date</li>
            <li><strong className="text-white">Transaction history:</strong> type, change (+/-), resulting balance, note, date</li>
          </ul>
          <DataTable
            headers={['Type', 'Icon', 'Description']}
            rows={[
              ['Earn',     '➕', 'Points, stamps or visits accumulated'],
              ['Redeem',   '🎁', 'Reward issued as a voucher'],
              ['Adjust',   '✏️', 'Manual balance correction'],
              ['Expire',   '⏰', 'Points expired automatically'],
              ['Refund',   '↩️', 'Points refunded'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to Customers → show the list',
            'Click Add customer',
            'Fill in: name "John Smith", phone "+1 555 987 6543", notes "Regular customer"',
            'Click Save → show the customer in the list with the generated access code',
            'Click View → show the full profile',
            'Show the sections: Enrollments, Vouchers, Transaction history',
            'Click the status button → show the active/inactive toggle',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.3 Programs ─ */}
      <Section id="programas" title="4.3 Loyalty programs">
        <DataTable
          headers={['Type', 'Icon', 'Description', 'Required config']}
          rows={[
            ['Points',   '⭐', 'Customers earn points per dollar spent', 'Points per dollar (1–10,000) · Minimum to redeem'],
            ['Stamps',   '🎟️', 'Digital stamp card',                    'Stamps per card (2–100)'],
            ['Visits',   '📍', 'Reward based on visit frequency',        'Visits needed (2–500)'],
            ['Cashback', '💰', 'Percentage return on purchase',          'Cashback % (0.1–50%) · Min. purchase (optional)'],
          ]}
        />
        <Note>Available program types depend on your plan. See section 5.</Note>

        <SubSection id="crear-programa" title="Create a program">
          <StepList steps={[
            'Go to Programs in the sidebar',
            'Click Add program',
            'Name (2–150 characters)',
            'Description (optional, max 500 characters)',
            'Select the type (Points, Stamps, Visits or Cashback)',
            'Fill in the type-specific configuration',
            'Max enrollments (optional — leave empty for unlimited)',
            'Start and end dates (optional — end must be after start)',
            'Click Create',
          ]} />
        </SubSection>

        <SubSection id="estados-programa" title="Program states">
          <InlineCode>Draft → Active → Paused → Archived</InlineCode>
          <DataTable
            headers={['State', 'Description']}
            rows={[
              ['Draft',    'Only visible to the admin. Customers cannot see it.'],
              ['Active',   'Customers can enroll and accumulate.'],
              ['Paused',   'No new transactions accepted temporarily.'],
              ['Archived', 'Finished. Historical queries only.'],
            ]}
          />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to Programs → show the list',
            'Click Add program',
            'Name: "Coffee Points", type: Points',
            'Enter: 10 points per dollar, minimum 100 points to redeem',
            'Click Create → show the program card in the list (state: Draft)',
            'Click the card → enter the detail view',
            'Click Activate → show the state changed to "Active"',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.4 Rewards ─ */}
      <Section id="recompensas" title="4.4 Rewards">
        <Note>Available from the Starter plan. The Free plan does not include a reward catalog.</Note>

        <SubSection id="crear-recompensa" title="Create a reward">
          <StepList steps={[
            'Go to Programs → select the program',
            'In the Rewards section, click Add reward',
            'Name (required, 2–150 characters)',
            'Description (optional, max 500 characters)',
            'Image (optional — HTTPS URL)',
            'Points cost (required — positive integer)',
            'Stock (optional — leave empty for unlimited)',
            'Voucher expiry days (optional)',
            'Click Save',
          ]} />
        </SubSection>

        <SubSection id="verificar-voucher" title="Verify a voucher at the counter">
          <StepList steps={[
            'Go to the corresponding program detail',
            'In the Verify voucher section, enter the code shown by the customer',
            'The system validates that the voucher is pending and not expired',
            'Confirm the redemption',
          ]} />
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Go to an active program → Rewards section',
            'Click Add reward',
            'Name: "Free coffee", cost: 100 points, stock: 50',
            'Click Save → show the reward in the table',
            'Scroll to Verify voucher → enter a sample code',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.5 Customer portal ─ */}
      <Section id="portal-cliente" title="4.5 Customer portal">
        <p>
          The interface for end customers. They access it with no password using their access
          code at <Code>[subdomain].fideliza.app/c</Code>.
        </p>
        <Note>
          The URL can include the code directly: <Code>?code=XXXX</Code> — useful for
          sharing via WhatsApp or SMS.
        </Note>

        <SubSection id="portal-tabs" title="The 3 portal tabs">
          <div className="space-y-3">
            {([
              ['⭐ Points',   'Pending vouchers · Enrollment cards showing balance, progress, stamps or visit counter'],
              ['🎁 Rewards',  'Reward catalog · Progress bar · Affordability indicator · Redeem button'],
              ['📋 History',  'Recent transactions list with icon, type, change and date'],
            ] as [string, string][]).map(([title, desc]) => (
              <div key={title} className="rounded-lg bg-white/5 border border-white/10 p-4">
                <p className="font-semibold text-white mb-1">{title}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            ))}
          </div>
        </SubSection>

        <GuiddeBox>
          <StepList steps={[
            'Open an incognito tab (to simulate the customer view)',
            'Navigate to [subdomain].fideliza.app/c',
            'Enter a valid access code → show how the portal loads',
            'Points tab: enrollment cards and progress',
            'Rewards tab: catalog, progress bar, click Redeem → voucher generated with code',
            'History tab: transaction list',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.6 Settings ─ */}
      <Section id="configuracion" title="4.6 Settings & branding">
        <DataTable
          headers={['Field', 'Description', 'Constraint']}
          rows={[
            ['Primary color',    'Portal header and button color',               'Hex format (#RRGGBB)'],
            ['Secondary color',  'Portal header gradient',                       'Hex format (#RRGGBB)'],
            ['Welcome message',  'Text shown to the customer when they open the portal', 'Max 500 characters'],
            ['Program label',    'Alternative name for points (e.g. "Stars")',   '1–50 characters'],
            ['Stamp icon',       'Emoji or icon name for stamps',               '1–50 characters'],
            ['Terms URL',        'Link to your terms and conditions',            'HTTPS only'],
          ]}
        />
        <GuiddeBox>
          <StepList steps={[
            'Go to Settings in the menu',
            'Change the primary color → pick a new color',
            'Type a welcome message: "Thanks for visiting! Earn points with every purchase."',
            'Change the program label to "Stars"',
            'Click Save',
            'Open the customer portal in another tab → verify the changes are applied',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.7 Billing ─ */}
      <Section id="facturacion" title="4.7 Billing & plans">
        <p>
          From <strong className="text-white">Settings → Billing</strong> you can view your
          current plan, upgrade, and manage your payment method. Payments are handled by
          Stripe. <strong className="text-indigo-400 font-bold">Fideliza</strong> does not store card data.
        </p>
        <Note>
          If payment fails, the system automatically reverts to the Free plan until the
          payment is resolved. You'll see an orange banner on the dashboard.
        </Note>
        <GuiddeBox>
          <StepList steps={[
            'Go to Settings → Billing section',
            'Show the current plan with its limits',
            'Click upgrade → show the cost preview',
            'Show the redirect to Stripe Checkout (do not complete the payment)',
            'Go back → show the "Manage payment method" button',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 4.8 Quick register ─ */}
      <Section id="registro-rapido" title="4.8 Quick register">
        <p>
          Fast point/stamp entry mode designed for in-store staff.
          Available at <Code>/dashboard/quick</Code>.
        </p>
        <StepList steps={[
          'Go to Quick register in the sidebar',
          'Enter the customer\'s access code',
          'The system automatically loads the customer and their active enrollments',
          'Select the program and record the transaction',
          'Confirm — the transaction is recorded immediately',
        ]} />
        <GuiddeBox>
          <StepList steps={[
            'Go to Quick register from the menu',
            'Enter the access code of an existing customer',
            'Show how the customer data and programs load automatically',
            'Select the program → enter the amount or action',
            'Confirm → show the confirmation screen',
          ]} />
        </GuiddeBox>
      </Section>

      {/* ─ 5. Plans ─ */}
      <Section id="planes" title="5. Plans & limitations">
        <DataTable
          headers={['Feature', 'Free', 'Starter', 'Pro']}
          rows={[
            ['Max customers',         '50',              '500',                    'Unlimited'],
            ['Max programs',          '1',               '3',                      'Unlimited'],
            ['Program types',         'Points, Stamps',  'Points, Stamps, Visits', 'Points, Stamps, Visits, Cashback'],
            ['Transaction history',   'Last 50',         'Unlimited',              'Unlimited'],
            ['Reward catalog',        '✗',               '✓',                      '✓'],
            ['CSV export',            '✗',               '✗',                      '✓'],
            ['Priority support',      '✗',               '✗',                      '✓'],
          ]}
        />
        <Note>
          If payment fails or the subscription is cancelled, the system applies Free plan
          restrictions. Existing data is preserved.
        </Note>
      </Section>

      {/* ─ 6. Errors ─ */}
      <Section id="errores" title="6. Errors & validations">
        <p className="font-medium text-white">Customers</p>
        <DataTable
          headers={['Error', 'Cause', 'Solution']}
          rows={[
            ['A customer with this phone number already exists', 'Phone already registered', 'Check if the customer already exists in the list'],
            ['Failed to generate unique access code after 5 attempts', 'Internal error', 'Try again; contact support if it persists'],
          ]}
        />
        <p className="font-medium text-white mt-4">Programs</p>
        <DataTable
          headers={['Error', 'Cause', 'Solution']}
          rows={[
            ['Your plan [X] allows a maximum of [N] programs', 'Plan limit reached', 'Upgrade your plan from Settings'],
            ['Program type "[type]" is not available on plan [X]', 'Type not included in plan', 'Upgrade your plan'],
            ['ends_at must be after starts_at', 'End date is before start date', 'Fix the dates'],
          ]}
        />
        <p className="font-medium text-white mt-4">Transactions</p>
        <DataTable
          headers={['Error', 'Cause', 'Solution']}
          rows={[
            ['Customer not found or inactive', 'Customer does not exist or is deactivated', 'Check the customer in the list'],
            ['Program not found or not active', 'Program is paused or archived', 'Change program status to Active'],
            ['Adjustment would result in negative balance', 'Adjustment would go below zero', 'Enter a smaller adjustment'],
            ['Customer must be enrolled in this program first', 'Customer not enrolled', 'Enroll the customer in the program'],
          ]}
        />
        <p className="font-medium text-white mt-4">Redemptions</p>
        <DataTable
          headers={['Error', 'Cause', 'Solution']}
          rows={[
            ['Reward is out of stock', 'Reward has depleted its stock', 'Update stock or deactivate the reward'],
            ['[customer] does not have enough [label] to redeem', 'Insufficient balance', 'Customer needs to keep accumulating'],
            ['Redemption code not found', 'Voucher code does not exist', 'Verify the code was entered correctly'],
            ['Redemption voucher has expired', 'Voucher has expired', 'Customer must request a new one'],
            ['Redemption is not pending', 'Voucher already used or cancelled', 'Voucher is not valid for redemption'],
          ]}
        />
        <p className="font-medium text-white mt-4">Customer portal</p>
        <DataTable
          headers={['Error', 'Cause', 'Solution']}
          rows={[
            ['Code not found. Please verify it and try again.', 'Access code is incorrect', 'Check the code in the admin panel'],
          ]}
        />
      </Section>

      {/* ─ 7. Best practices ─ */}
      <Section id="buenas-practicas" title="7. Best practices">
        <div className="space-y-5">
          {([
            ['Initial setup', [
              'Set your colors before launching the portal. Customers will see your brand identity from their very first visit.',
              'Write a welcome message. It appears in the portal and improves the customer experience.',
              'Customize the points label: "Stars", "Beans", "Miles".',
            ]],
            ['Managing programs', [
              'Start with a single program. It\'s easier to communicate and scale.',
              'Use Draft status to prepare a program before launching it.',
              'Don\'t delete programs. Use Archived to preserve the history.',
            ]],
            ['Managing customers', [
              'Add the customer\'s phone number whenever possible.',
              'Use internal notes to record special preferences.',
              'Don\'t deactivate customers without reason — they\'ll lose portal access.',
            ]],
            ['Rewards', [
              'Set stock on physical rewards to avoid over-issuing.',
              'Use expiry days to create urgency (e.g. 30 days to redeem).',
              'Deactivate rewards instead of deleting them.',
            ]],
            ['Daily operations', [
              'Use Quick register in-store to speed up service.',
              'Check the Dashboard at the start of the day.',
              'Export the CSV monthly (Pro plan) for a transaction backup.',
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

      {/* ─ 8. FAQ ─ */}
      <Section id="faq" title="8. FAQ">
        <div className="space-y-4">
          {([
            ['Do customers need to install an app?',
             'No. The portal is a website that works from any browser on any device. No installation required.'],
            ['How does the customer receive their access code?',
             'You give it to them when registering them. The code appears in the customer list and their detail view.'],
            ['Can a customer lose their points if they lose their code?',
             'No. You can look up the customer by name or phone, retrieve their code, and share it again.'],
            ['Can I have multiple businesses on one account?',
             'No. Each account is tied to a single business. For multiple businesses you need separate accounts.'],
            ['Can transactions be deleted?',
             'No. The transaction history is immutable. If there\'s an error, use an Adjustment transaction to correct the balance.'],
            ['Can customers see other customers\' data?',
             'No. The portal only shows that specific customer\'s information.'],
            ['What are "pending vouchers"?',
             'Rewards the customer already redeemed from the portal but haven\'t been physically verified at the counter yet. The customer shows the code and staff verifies it in the system.'],
            ['When do vouchers expire?',
             'It depends on the reward configuration. Without an expiry setting, the voucher never expires.'],
            ['Can I pause a program without losing data?',
             'Yes. The Paused state stops new transactions but preserves all balances and history. You can reactivate it anytime.'],
            ['What happens when I change plans?',
             'If you upgrade, new features become available immediately. If you downgrade (or there\'s a payment issue), Free plan restrictions apply but all existing data is preserved.'],
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
