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
 */

export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  private constructor(amount: number, currency: string) {
    this._amount = Math.round(amount * 100) / 100;
    this._currency = currency.toUpperCase();
  }

  static create(amount: number, currency: string = 'USD'): Money {
    return new Money(amount, currency);
  }

  static zero(currency: string = 'USD'): Money {
    return new Money(0, currency);
  }

  static fromCents(cents: number, currency: string = 'USD'): Money {
    return new Money(cents / 100, currency);
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  get cents(): number {
    return Math.round(this._amount * 100);
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount - other._amount, this._currency);
  }

  multiply(factor: number): Money {
    return new Money(this._amount * factor, this._currency);
  }

  divide(divisor: number): Money {
    if (divisor === 0) {
      throw new Error('Cannot divide by zero');
    }
    return new Money(this._amount / divisor, this._currency);
  }

  percentage(percent: number): Money {
    return new Money((this._amount * percent) / 100, this._currency);
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

    const rawCents = weights.map(w => (this.cents * w) / weightSum);
    const roundedCents = rawCents.map(c => Math.round(c));
    const totalCents = Math.round(this.cents);
    const currentSum = roundedCents.reduce((s, c) => s + c, 0);
    const delta = totalCents - currentSum;

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

    return roundedCents.map(c => new Money(c / 100, this._currency));
  }

  isZero(): boolean {
    return this._amount === 0;
  }

  isPositive(): boolean {
    return this._amount > 0;
  }

  isNegative(): boolean {
    return this._amount < 0;
  }

  equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  greaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  lessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  format(locale: string = 'en-US'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: this._currency,
    }).format(this._amount);
  }

  toString(): string {
    return `${this._currency} ${this._amount.toFixed(2)}`;
  }

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this._amount,
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
