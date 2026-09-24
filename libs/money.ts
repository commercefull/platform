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
 */

export class Money {
  private readonly _cents: number;
  private readonly _currency: string;

  private constructor(cents: number, currency: string) {
    this._cents = Math.round(cents);
    this._currency = currency.toUpperCase();
  }

  static create(amount: number, currency: string = 'USD'): Money {
    return new Money(amount * 100, currency);
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  static fromCents(cents: number, currency: string = 'USD'): Money {
    return new Money(cents, currency);
  }

  get amount(): number {
    return this._cents / 100;
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
    return `${this._currency} ${this.amount.toFixed(2)}`;
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
  return formatPrice(cents / 100, currency, locale);
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
): string {
  const formatted = formatPrice(amount, currency, locale);
  if (priceDisplayMode === 'inclusive_tax') {
    return `${formatted} (incl. VAT)`;
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
): string {
  return formatPriceWithTax(cents / 100, currency, locale, priceDisplayMode);
}
