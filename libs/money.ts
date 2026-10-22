/**
 * Money Value Object — Shared Kernel
 *
 * Immutable representation of monetary value with currency.
 * Promoted from basket/domain/valueObjects/Money to libs/ as a shared kernel primitive.
 * Merges the basket and order Money implementations into a single canonical type.
 *
 * Admission criteria (§5.4 of the roadmap):
 * - No dependencies, no I/O, no module-specific business rules.
 * - Stable API, agreed by all consuming contexts.
 *
 * Internally stores an exact integer number of minor units (cents). Use
 * `Money.fromCents` at the DB/API boundary (columns are bigint cents) and
 * `Money.create` when the source value is in major units (e.g. 49.99).
 * Convert to a display string only at the view layer via format()/formatCents().
 *
 * Minor-unit handling is ISO 4217 aware: `Money.create(1500, 'JPY')` stores
 * 1500 minor units (not 150000), and `Money.create(1.234, 'KWD')` stores 1234.
 * Never multiply/divide by a hardcoded `100` at call sites — use
 * `toMinorUnits`/`fromMinorUnits` so 0- and 3-decimal currencies stay correct.
 */

/** ISO 4217 minor-unit exponents for currencies that are not 2-decimal. */
const CURRENCY_DECIMALS: Record<string, number> = {
  // 0-decimal currencies
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  UYI: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  // 3-decimal currencies
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  OMR: 3,
  TND: 3,
  // 4-decimal currency
  CLF: 4,
  UYW: 4,
};

/**
 * Number of minor units per major unit for a currency (ISO 4217 exponent).
 * Defaults to 2 for every currency not listed in `CURRENCY_DECIMALS`.
 */
export function getCurrencyDecimals(currency: string): number {
  return CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
}

/** Convert a major-unit amount (e.g. 49.99) to integer minor units (e.g. 4999). */
export function toMinorUnits(majorAmount: number, currency: string): number {
  const factor = 10 ** getCurrencyDecimals(currency);
  return Math.round(majorAmount * factor);
}

/** Convert integer minor units (e.g. 4999) to a major-unit amount (e.g. 49.99). */
export function fromMinorUnits(minorAmount: number, currency: string): number {
  const factor = 10 ** getCurrencyDecimals(currency);
  return minorAmount / factor;
}

export class Money {
  private readonly _cents: number;
  private readonly _currency: string;

  private constructor(cents: number, currency: string) {
    this._cents = Math.round(cents);
    this._currency = currency.toUpperCase();
  }

  static create(amount: number, currency: string = 'USD'): Money {
    return new Money(toMinorUnits(amount, currency), currency);
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  static fromCents(cents: number, currency: string = 'USD'): Money {
    return new Money(cents, currency);
  }

  get amount(): number {
    return fromMinorUnits(this._cents, this._currency);
  }

  get currency(): string {
    return this._currency;
  }

  get cents(): number {
    return this._cents;
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._cents + other._cents, this._currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._cents - other._cents, this._currency);
  }

  multiply(factor: number): Money {
    return new Money(this._cents * factor, this._currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this._cents / divisor, this._currency);
  }

  percentage(percent: number): Money {
    return new Money((this._cents * percent) / 100, this._currency);
  }

  /**
   * Allocate this amount across `weights` proportionally, with delta correction
   * so the parts sum to the original amount exactly (no penny drift).
   * @param weights Proportional weights (need not sum to 1).
   */
  allocate(weights: number[]): Money[] {
    if (weights.length === 0) return [];
    const weightSum = weights.reduce((s, w) => s + w, 0);
    if (weightSum === 0) return weights.map(() => new Money(0, this._currency));

    const rawCents = weights.map(w => (this._cents * w) / weightSum);
    const roundedCents = rawCents.map(c => Math.round(c));
    const currentSum = roundedCents.reduce((s, c) => s + c, 0);
    const delta = this._cents - currentSum;

    if (delta !== 0) {
      // Apply delta to the largest-weight line to minimise relative distortion.
      let maxIdx = 0;
      let maxWeight = -Infinity;
      for (let i = 0; i < weights.length; i++) {
        if (weights[i] > maxWeight) {
          maxWeight = weights[i];
          maxIdx = i;
        }
      }
      roundedCents[maxIdx] += delta;
    }

    return roundedCents.map(c => new Money(c, this._currency));
  }

  isZero(): boolean {
    return this._cents === 0;
  }

  isPositive(): boolean {
    return this._cents > 0;
  }

  isNegative(): boolean {
    return this._cents < 0;
  }

  equals(other: Money): boolean {
    return this._cents === other._cents && this._currency === other._currency;
  }

  greaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._cents > other._cents;
  }

  lessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._cents < other._cents;
  }

  isGreaterThan(other: Money): boolean {
    return this.greaterThan(other);
  }

  isLessThan(other: Money): boolean {
    return this.lessThan(other);
  }

  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
    }).format(this.amount);
  }

  toString(): string {
    return `${this._currency} ${this.amount.toFixed(getCurrencyDecimals(this._currency))}`;
  }

  toJSON(): { cents: number; currency: string } {
    return {
      cents: this._cents,
      currency: this._currency,
    };
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`);
    }
  }
}

// ============================================================================
// Standalone formatting helpers (for use in EJS views and controllers)
// ============================================================================

/**
 * Format a numeric amount with currency using Intl.NumberFormat.
 *
 * @example
 *   formatPrice(49.99, 'GBP', 'en-GB')  → "£49.99"
 *   formatPrice(49.99, 'USD', 'en-US')  → "$49.99"
 */
export function formatPrice(amount: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

/**
 * Format an integer-cent amount with currency using Intl.NumberFormat.
 * This is the boundary helper for the cents-based wire/storage model.
 *
 * @example
 *   formatCents(4999, 'GBP', 'en-GB')  → "£49.99"
 *   formatCents(4999, 'USD', 'en-US')  → "$49.99"
 */
export function formatCents(cents: number, currency: string = 'USD', locale: string = 'en-US'): string {
  return formatPrice(fromMinorUnits(cents, currency), currency, locale);
}

/**
 * Format a price with optional tax-inclusive suffix.
 *
 * @example
 *   formatPriceWithTax(49.99, 'GBP', 'en-GB', 'inclusive_tax')  → "£49.99 (incl. VAT)"
 *   formatPrice(49.99, 'USD', 'en-US', 'exclusive_tax')         → "$49.99"
 */
export function formatPriceWithTax(
  amount: number,
  currency: string,
  locale: string,
  priceDisplayMode: 'inclusive_tax' | 'exclusive_tax' = 'exclusive_tax',
  taxLabel: string = 'incl. VAT',
): string {
  const formatted = formatPrice(amount, currency, locale);
  if (priceDisplayMode === 'inclusive_tax') {
    return `${formatted} (${taxLabel})`;
  }
  return formatted;
}

/**
 * Format an integer-cent amount with optional tax-inclusive suffix.
 *
 * @example
 *   formatCentsWithTax(4999, 'GBP', 'en-GB', 'inclusive_tax')  → "£49.99 (incl. VAT)"
 *   formatCentsWithTax(4999, 'USD', 'en-US', 'exclusive_tax')  → "$49.99"
 */
export function formatCentsWithTax(
  cents: number,
  currency: string,
  locale: string,
  priceDisplayMode: 'inclusive_tax' | 'exclusive_tax' = 'exclusive_tax',
  taxLabel: string = 'incl. VAT',
): string {
  return formatPriceWithTax(fromMinorUnits(cents, currency), currency, locale, priceDisplayMode, taxLabel);
}
