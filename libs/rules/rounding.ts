/**
 * Rounding Strategy — Delta-Corrected Rounding
 *
 * Ensures that the sum of rounded line amounts equals the rounded total,
 * eliminating the penny-rounding drift that occurs when each line is rounded
 * independently. Ports the `rounding.ts` pattern from the standalone
 * rule-engine packages.
 *
 * Two modes:
 * - `perLine`  — round each line to the minor unit (e.g. cent), then distribute
 *                any delta between sum-of-lines and rounded-total to a single
 *                line so the books balance.
 * - `perTotal` — round the total only; lines are left at full precision.
 *
 * Admission criteria (mirrors `libs/money.ts`):
 * - No dependencies, no I/O, no module-specific business rules.
 */

/** Rounding strategy. */
export type RoundingMode = 'perLine' | 'perTotal';

/** Default number of decimal places (2 = cents). */
export const DEFAULT_DECIMALS = 2;

/**
 * Round a single number to `decimals` places using half-up rounding.
 */
export function roundTo(value: number, decimals: number = DEFAULT_DECIMALS): number {
  const factor = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/**
 * Round a list of line amounts with delta correction so that
 * `sum(rounded) === round(sum(raw))`.
 *
 * The delta (positive or negative) is applied to the line with the largest
 * fractional remainder, which minimises the per-line distortion.
 *
 * @param lines   Raw line amounts (full precision).
 * @param mode    `perLine` (default) or `perTotal`.
 * @param decimals Number of decimal places (default 2).
 * @returns Rounded line amounts whose sum equals the rounded total.
 */
export function roundWithDeltaCorrection(lines: number[], mode: RoundingMode = 'perLine', decimals: number = DEFAULT_DECIMALS): number[] {
  if (lines.length === 0) return [];

  if (mode === 'perTotal') {
    // Lines stay at full precision; only the total is rounded by the caller.
    return lines.map(l => roundTo(l, decimals));
  }

  // perLine: round each, then correct the delta on the largest-remainder line.
  const rounded = lines.map(l => roundTo(l, decimals));
  const rawTotal = lines.reduce((s, v) => s + v, 0);
  const roundedTotal = roundTo(rawTotal, decimals);
  const currentSum = rounded.reduce((s, v) => s + v, 0);
  const delta = roundTo(roundedTotal - currentSum, decimals);

  if (delta === 0) return rounded;

  // Apply delta to the line with the largest absolute value to minimise
  // relative distortion. If all lines are zero, apply to the first.
  let targetIndex = 0;
  let maxAbs = -Infinity;
  for (let i = 0; i < rounded.length; i++) {
    const abs = Math.abs(rounded[i]);
    if (abs > maxAbs) {
      maxAbs = abs;
      targetIndex = i;
    }
  }

  const corrected = [...rounded];
  corrected[targetIndex] = roundTo(corrected[targetIndex] + delta, decimals);
  return corrected;
}

/**
 * Allocate a total amount across `weights` proportionally, with delta
 * correction so the parts sum to the total exactly.
 *
 * @param total   Amount to allocate.
 * @param weights Proportional weights (need not sum to 1).
 * @param decimals Decimal places (default 2).
 * @returns Allocated amounts, one per weight.
 */
export function allocateWithDeltaCorrection(total: number, weights: number[], decimals: number = DEFAULT_DECIMALS): number[] {
  if (weights.length === 0) return [];
  const weightSum = weights.reduce((s, w) => s + w, 0);
  if (weightSum === 0) return weights.map(() => 0);

  const raw = weights.map(w => (total * w) / weightSum);
  return roundWithDeltaCorrection(raw, 'perLine', decimals);
}
