/**
 * How a program's balance is named and displayed.
 *
 * Single source of truth: this logic previously existed as three separate,
 * quietly diverging copies (`bonusLabel` in the portal, `unitLabelFromType` in
 * the birthday cron, `unitLabel` in the referrals screen), which is how the
 * referral card ended up saying "pts" for a stamps program.
 *
 * ── The cashback gotcha ──────────────────────────────────────────────
 * A cashback balance is NOT points: it is money, stored in CENTS. One unit of
 * `points_delta` equals one cent of store credit (see computeEarnDelta in
 * points-calculator.ts). So a stored value of 1000 means $10.00, and anything
 * a human types in pesos has to be multiplied by 100 before it is stored.
 * Every other program type stores exactly what it displays.
 */

export type ProgramType = 'points' | 'stamp' | 'visit' | 'cashback';

const UNITS: Record<ProgramType, { one: string; many: string; title: string }> = {
  points:   { one: 'punto',  many: 'puntos',  title: 'Puntos'   },
  stamp:    { one: 'sello',  many: 'sellos',  title: 'Sellos'   },
  visit:    { one: 'visita', many: 'visitas', title: 'Visitas'  },
  cashback: { one: 'peso',   many: 'pesos',   title: 'Cashback' },
};

function unitsFor(type: string) {
  return UNITS[(type as ProgramType)] ?? UNITS.points;
}

/** Lowercase unit name, pluralised for `count`. e.g. (stamp, 1) → "sello". */
export function unitLabel(type: string, count = 2): string {
  const u = unitsFor(type);
  return Math.abs(count) === 1 ? u.one : u.many;
}

/**
 * Plural, title-cased label — the form used as `{{unit_label}}` in the approved
 * WhatsApp templates ("te hemos añadido 50 Sellos").
 */
export function unitLabelTitle(type: string): string {
  return unitsFor(type).title;
}

/**
 * Formats an amount held in the program's STORAGE units for display.
 *
 *   formatUnitAmount('stamp', 1)      → "1 sello"
 *   formatUnitAmount('points', 50)    → "50 puntos"
 *   formatUnitAmount('cashback', 1000)→ "$10.00"
 */
export function formatUnitAmount(type: string, amount: number): string {
  if (type === 'cashback') {
    return `$${(amount / 100).toFixed(2)}`;
  }
  return `${amount} ${unitLabel(type, amount)}`;
}

/** True when the type stores a different number than it shows to a human. */
export function usesCurrency(type: string): boolean {
  return type === 'cashback';
}

/** Human-entered value → what gets stored. Pesos become cents for cashback. */
export function toStorageUnits(type: string, displayValue: number): number {
  return usesCurrency(type) ? Math.round(displayValue * 100) : Math.round(displayValue);
}

/** Stored value → what a human should see in an input field. */
export function fromStorageUnits(type: string, stored: number): number {
  return usesCurrency(type) ? stored / 100 : stored;
}
