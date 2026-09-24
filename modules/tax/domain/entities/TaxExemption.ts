/**
 * TaxExemption Domain Entity
 *
 * Wraps a `customerTaxExemption` row and provides type-aware, category-aware,
 * amount-bounded exemption evaluation. Replaces the binary all-or-nothing
 * `isExempt` flag in `CalculateOrderTax` with a per-line-item verdict.
 *
 * Supports 10 exemption types (matching rule-engine's `tax-exemption-engine`):
 * resale, diplomatic, nonprofit, vatReverseCharge, agricultural, manufacturing,
 * government, educational, medical, export.
 *
 * See `docs/e2e-rule-engine-implementation-plan.md` Epic B.
 */

import type { TaxExemptionType, TaxExemptionStatus, ExemptionVerdict, ExemptionEvaluationContext } from '../../taxTypes';

export interface TaxExemptionProps {
  id: string;
  customerId: string;
  type: TaxExemptionType;
  status: TaxExemptionStatus;
  exemptionNumber: string;
  name: string;
  startDate: Date | number;
  expiryDate?: Date | number | null;
  isVerified: boolean;
  applicableTaxCategoryIds?: string[] | null;
  minOrderAmountCents?: number | null;
  maxOrderAmountCents?: number | null;
  exemptionPercent?: number;
}

export class TaxExemption {
  private readonly props: TaxExemptionProps;

  constructor(props: TaxExemptionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get type(): TaxExemptionType {
    return this.props.type;
  }

  get status(): TaxExemptionStatus {
    return this.props.status;
  }

  get exemptionPercent(): number {
    return this.props.exemptionPercent ?? 100;
  }

  get applicableTaxCategoryIds(): string[] | null {
    return this.props.applicableTaxCategoryIds ?? null;
  }

  /**
   * Evaluate this exemption against a line item in the given order context.
   *
   * Returns:
   * - `'exempt'`         — full exemption (exemptionPercent = 100, all checks pass)
   * - `'partiallyExempt'` — partial exemption (0 < exemptionPercent < 100)
   * - `'notExempt'`       — exemption does not apply (category mismatch, amount out of bounds, expired, etc.)
   * - `'pending'`         — exemption exists but is not yet approved/verified
   */
  evaluate(context: ExemptionEvaluationContext): ExemptionVerdict {
    // Pending exemptions don't apply yet
    if (this.props.status === 'pending') return 'pending';
    if (this.props.status === 'rejected' || this.props.status === 'revoked') return 'notExempt';

    // Only approved/active exemptions apply
    if (this.props.status !== 'approved' && this.props.status !== 'active') return 'notExempt';

    // Check expiry
    const now = context.now ?? new Date();
    if (this.props.expiryDate) {
      const expiry = this.props.expiryDate instanceof Date ? this.props.expiryDate : new Date(this.props.expiryDate);
      if (now > expiry) return 'notExempt';
    }

    // Check category applicability
    if (this.applicableTaxCategoryIds !== null && this.applicableTaxCategoryIds !== undefined) {
      if (context.taxCategoryId && !this.applicableTaxCategoryIds.includes(context.taxCategoryId)) {
        return 'notExempt';
      }
    }

    // Check order amount bounds
    const orderSubtotal = context.orderSubtotalCents;
    if (this.props.minOrderAmountCents !== null && this.props.minOrderAmountCents !== undefined) {
      if (orderSubtotal < Number(this.props.minOrderAmountCents)) return 'notExempt';
    }
    if (this.props.maxOrderAmountCents !== null && this.props.maxOrderAmountCents !== undefined) {
      if (orderSubtotal > Number(this.props.maxOrderAmountCents)) return 'notExempt';
    }

    // Determine verdict based on exemption percent
    const percent = this.exemptionPercent;
    if (percent >= 100) return 'exempt';
    if (percent > 0) return 'partiallyExempt';
    return 'notExempt';
  }

  /**
   * Compute the effective tax rate multiplier after applying this exemption.
   * Returns a number between 0 and 1:
   * - 0 = fully exempt (no tax)
   * - 0.5 = 50% partial exemption (half the tax applies)
   * - 1 = not exempt (full tax applies)
   */
  effectiveTaxRateMultiplier(context: ExemptionEvaluationContext): number {
    const verdict = this.evaluate(context);
    if (verdict === 'exempt') return 0;
    if (verdict === 'partiallyExempt') return 1 - this.exemptionPercent / 100;
    return 1;
  }

  /**
   * Check if this exemption applies to a specific tax category.
   */
  appliesToCategory(taxCategoryId?: string): boolean {
    if (this.applicableTaxCategoryIds === null || this.applicableTaxCategoryIds === undefined) return true;
    if (!taxCategoryId) return true;
    return this.applicableTaxCategoryIds.includes(taxCategoryId);
  }

  toJSON(): TaxExemptionProps {
    return { ...this.props };
  }
}
