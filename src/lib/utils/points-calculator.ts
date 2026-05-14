/**
 * Points calculation utilities — pure functions, no DB calls.
 *
 * Converts a purchase amount (in cents) into the correct points_delta
 * to pass to POST /api/transactions based on the program type and config.
 *
 * Usage in the dashboard:
 *   const program = await getProgramById(tenantId, programId);
 *   const { points_delta, note } = computeEarnDelta(amountCents, program);
 *   await fetch('/api/transactions', {
 *     method: 'POST',
 *     body: JSON.stringify({ customer_id, program_id, type: 'earn', points_delta, note }),
 *   });
 */

import type {
  RewardProgram,
  PointsProgramConfig,
  CashbackProgramConfig,
} from '@/lib/types';

// ── Result type ───────────────────────────────────────────────────────

export interface EarnDelta {
  /** Points to award. Zero means the transaction should NOT be recorded. */
  points_delta: number;
  /** Auto-generated human-readable note for the transaction ledger. */
  note: string;
  /** True when the purchase did not qualify (e.g. below cashback minimum). */
  skipped: boolean;
  /** Human-readable reason if skipped. */
  skip_reason?: string;
}

// ── Main calculator ───────────────────────────────────────────────────

/**
 * Computes the points_delta to award for a purchase.
 *
 * @param amountCents  Purchase amount in cents (integer, e.g. 2500 = $25.00)
 * @param program      The active RewardProgram the customer is enrolled in
 */
export function computeEarnDelta(
  amountCents: number,
  program: RewardProgram
): EarnDelta {
  if (amountCents < 0) {
    throw new Error('El monto no puede ser negativo');
  }

  const dollars = amountCents / 100;

  switch (program.type) {
    case 'points':
      return computePointsEarn(amountCents, dollars, program.config as PointsProgramConfig);

    case 'stamp':
      // One stamp per qualifying transaction regardless of amount
      return {
        points_delta: 1,
        note: 'Stamp added',
        skipped: false,
      };

    case 'visit':
      // One visit per transaction regardless of amount
      return {
        points_delta: 1,
        note: 'Visit recorded',
        skipped: false,
      };

    case 'cashback':
      return computeCashbackEarn(amountCents, dollars, program.config as CashbackProgramConfig);
  }
}

function computePointsEarn(
  amountCents: number,
  dollars: number,
  config: PointsProgramConfig
): EarnDelta {
  const points = Math.floor(dollars * config.points_per_dollar);

  if (points === 0) {
    return {
      points_delta: 0,
      note: `Purchase $${dollars.toFixed(2)} — below 1-point threshold`,
      skipped: true,
      skip_reason: 'Purchase too small to earn any points',
    };
  }

  return {
    points_delta: points,
    note: `Purchase $${dollars.toFixed(2)}`,
    skipped: false,
  };
}

function computeCashbackEarn(
  amountCents: number,
  dollars: number,
  config: CashbackProgramConfig
): EarnDelta {
  const minDollars = config.min_purchase_cents / 100;

  if (amountCents < config.min_purchase_cents) {
    return {
      points_delta: 0,
      note: `Purchase $${dollars.toFixed(2)} — below minimum`,
      skipped: true,
      skip_reason: `Minimum purchase for cashback is $${minDollars.toFixed(2)}`,
    };
  }

  // Cashback is stored in cents so 1 unit = $0.01 store credit
  const cashbackCents = Math.floor(amountCents * config.cashback_percent / 100);

  return {
    points_delta: cashbackCents,
    note: `${config.cashback_percent}% cashback on $${dollars.toFixed(2)}`,
    skipped: false,
  };
}

// ── Validation helpers ────────────────────────────────────────────────

/**
 * Validates that an earn transaction can proceed for this program.
 * Returns an error string or null if valid.
 *
 * Note: the DB / RPC also enforces these rules — this is a fast pre-check
 * so the UI can show a friendly message without a round trip.
 */
export function validateEarnEligibility(
  program: RewardProgram,
  amountCents: number
): string | null {
  if (program.status !== 'active') {
    return `El programa "${program.name}" está ${program.status} — no se pueden acumular puntos`;
  }

  const now = new Date();

  if (program.starts_at && new Date(program.starts_at) > now) {
    return `El programa "${program.name}" inicia el ${new Date(program.starts_at).toLocaleDateString('es')}`;
  }

  if (program.ends_at && new Date(program.ends_at) < now) {
    return `El programa "${program.name}" finalizó el ${new Date(program.ends_at).toLocaleDateString('es')}`;
  }

  if (amountCents < 0) {
    return 'El monto de compra no puede ser negativo';
  }

  return null;
}

/**
 * Validates that a redemption can proceed (pre-flight, no DB call).
 * Returns an error string or null if valid.
 */
export function validateRedeemEligibility(
  currentPoints: number,
  rewardCostPoints: number,
  rewardStock: number | null
): string | null {
  if (currentPoints < rewardCostPoints) {
    return `Saldo insuficiente. Se necesitan ${rewardCostPoints} puntos, tienes ${currentPoints}`;
  }

  if (rewardStock !== null && rewardStock <= 0) {
    return 'La recompensa está agotada';
  }

  return null;
}

// ── Formatting helpers ────────────────────────────────────────────────

/**
 * Returns a human-readable label for the points unit depending on program type.
 * Used in UI strings like "You earned 50 Beans".
 */
export function pointsLabel(programType: RewardProgram['type'], programLabel = 'Points'): string {
  switch (programType) {
    case 'stamp':    return 'stamps';
    case 'visit':    return 'visits';
    case 'cashback': return 'cashback';
    default:         return programLabel.toLowerCase();
  }
}
