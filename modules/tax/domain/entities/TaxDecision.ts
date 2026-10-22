/**
 * TaxDecision — Explainable Tax Quote Value Object
 *
 * The persisted, versioned record of a tax calculation: the regime that
 * applied, per-line breakdown, and the policy-version/decision record used
 * to produce it. Checkout persists this on the order so refunds and audits
 * can replay the exact tax logic that ran at purchase time.
 */

import type { PolicyDecisionRecord } from '../../../../libs/rules/policyEngine';

/** Named tax regimes the platform recognises. */
export type TaxRegime =
  | 'US_SALES_TAX'
  | 'US_SALES_TAX_NO_NEXUS'
  | 'EU_VAT_DOMESTIC'
  | 'EU_VAT_CROSS_BORDER_B2C'
  | 'EU_B2B_REVERSE_CHARGE'
  | 'UK_VAT'
  | 'DOMESTIC_TAX'
  | 'CROSS_BORDER_IMPORT'
  | 'EXEMPT'
  | 'NO_TAX';

/** Per-line tax breakdown, mirroring the quote's lineItems shape. */
export interface TaxDecisionLine {
  productId: string;
  name: string;
  subtotalCents: number;
  taxAmountCents: number;
  taxRate: number;
  taxRuleId?: string;
  jurisdiction?: string;
  exemptionVerdict?: string;
}

export interface TaxDecisionProps {
  /** Regime that governed the quote. */
  taxRegime: TaxRegime;
  /** Version marker for order-time policy snapshots. */
  taxPolicyVersion: string;
  /** Whether B2B reverse charge applied. */
  reverseChargeApplied: boolean;
  /** Customer VAT number echoed when reverse charge applied. */
  vatNumber?: string;
  /** Jurisdictions that contributed tax (e.g. 'US-CA', 'DE', 'EU'). */
  jurisdictionBreakdown: string[];
  /** Per-line tax rows. */
  lineItems: TaxDecisionLine[];
  /** Total tax in minor units (embedded + added). */
  taxAmountCents: number;
  /** Portion added on top of the subtotal (exclusive tax). */
  taxAddedCents: number;
  /** Whether prices already included tax. */
  taxIncludedInSubtotal: boolean;
  /** The explainable policy decision record for the order log. */
  decisionRecord?: PolicyDecisionRecord;
}

export class TaxDecision {
  private readonly props: TaxDecisionProps;

  private constructor(props: TaxDecisionProps) {
    this.props = props;
  }

  static create(props: TaxDecisionProps): TaxDecision {
    return new TaxDecision(props);
  }

  static reconstitute(props: TaxDecisionProps): TaxDecision {
    return new TaxDecision(props);
  }

  get taxRegime(): TaxRegime {
    return this.props.taxRegime;
  }
  get taxPolicyVersion(): string {
    return this.props.taxPolicyVersion;
  }
  get reverseChargeApplied(): boolean {
    return this.props.reverseChargeApplied;
  }
  get vatNumber(): string | undefined {
    return this.props.vatNumber;
  }
  get jurisdictionBreakdown(): string[] {
    return [...this.props.jurisdictionBreakdown];
  }
  get lineItems(): TaxDecisionLine[] {
    return this.props.lineItems.map(l => ({ ...l }));
  }
  get taxAmountCents(): number {
    return this.props.taxAmountCents;
  }
  get taxAddedCents(): number {
    return this.props.taxAddedCents;
  }
  get taxIncludedInSubtotal(): boolean {
    return this.props.taxIncludedInSubtotal;
  }
  get decisionRecord(): PolicyDecisionRecord | undefined {
    return this.props.decisionRecord;
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props, lineItems: this.lineItems };
  }
}
