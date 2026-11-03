/**
 * Command / response types for CalculateOrderTax — extracted for file size.
 */

import { TaxExemption } from '../../domain/entities/TaxExemption';
import type { TaxRegime } from '../../domain/entities/TaxDecision';
import type { AddressInput, ExemptionVerdict } from '../../taxTypes';
import type { PolicyDecisionRecord } from '../../../../libs/rules/policyEngine';

export interface TaxRateInfo {
  rate: number;
  includeInPrice: boolean;
}

// ============================================================================
// Command
// ============================================================================

export interface OrderLineItem {
  productId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  taxCategoryId?: string;
  taxable?: boolean;
}

export interface TaxAddress {
  country: string;
  region?: string;
  state?: string;
  postalCode?: string;
  city?: string;
}
export interface CalculateOrderTaxCommandProps {
  items: OrderLineItem[];
  shippingAddress: TaxAddress;
  shippingAmountCents?: number;
  customerId?: string;
  pricesIncludeTax?: boolean;
  /** Customer VAT ID (B2B) — enables intra-EU reverse-charge quoting. */
  vatNumber?: string;
  /** Seller organization — enables nexus coverage and VAT registration checks. */
  organizationId?: string;
  /** Seller/origin country (store country) — used to detect cross-border EU sales. */
  originCountry?: string;
  /** Buyer type — B2B enables reverse-charge treatment where applicable. */
  buyerType?: 'B2C' | 'B2B';
  /** Richer ship-from address (warehouse); `country` wins over originCountry when both set. */
  shipFromAddress?: TaxAddress;
  /** Billing address — used when no shipping destination exists (digital goods). */
  billToAddress?: TaxAddress;
  /** Incoterms for cross-border duty/tax responsibility (DDP/DDU/…). */
  incoterms?: string;
  /** When the transaction occurs — drives historical rate lookup + versioning. */
  transactionTimestamp?: Date;
  /** Selling market + channel context recorded on the decision. */
  marketId?: string;
  channelId?: string;
  /** Transaction currency (minor units below are in this currency). */
  currencyCode?: string;
}

export class CalculateOrderTaxCommand {
  public readonly items: OrderLineItem[];
  public readonly shippingAddress: TaxAddress;
  public readonly shippingAmountCents: number;
  public readonly customerId?: string;
  public readonly pricesIncludeTax: boolean;
  public readonly vatNumber?: string;
  public readonly organizationId?: string;
  public readonly originCountry?: string;
  public readonly buyerType?: 'B2C' | 'B2B';
  public readonly shipFromAddress?: TaxAddress;
  public readonly billToAddress?: TaxAddress;
  public readonly incoterms?: string;
  public readonly transactionTimestamp?: Date;
  public readonly marketId?: string;
  public readonly channelId?: string;
  public readonly currencyCode?: string;

  constructor(props: CalculateOrderTaxCommandProps) {
    this.items = props.items;
    this.shippingAddress = props.shippingAddress;
    this.shippingAmountCents = props.shippingAmountCents ?? 0;
    this.customerId = props.customerId;
    this.pricesIncludeTax = props.pricesIncludeTax ?? false;
    this.vatNumber = props.vatNumber;
    this.organizationId = props.organizationId;
    this.originCountry = props.originCountry;
    this.buyerType = props.buyerType;
    this.shipFromAddress = props.shipFromAddress;
    this.billToAddress = props.billToAddress;
    this.incoterms = props.incoterms;
    this.transactionTimestamp = props.transactionTimestamp;
    this.marketId = props.marketId;
    this.channelId = props.channelId;
    this.currencyCode = props.currencyCode;
  }
}

// ============================================================================
// Response
// ============================================================================

export interface TaxLineItem {
  productId: string;
  name: string;
  subtotalCents: number;
  taxAmountCents: number;
  taxRate: number;
  exemptionVerdict?: ExemptionVerdict;
}

export interface CalculateOrderTaxResponse {
  success: boolean;
  subtotalCents: number;
  shippingAmountCents: number;
  taxAmountCents: number;
  totalCents: number;
  taxRate: number;
  lineItems: TaxLineItem[];
  /** True when item/shipping prices already include tax — taxAmountCents is the embedded portion, not an additional charge */
  taxIncludedInSubtotal: boolean;
  /**
   * Portion of taxAmountCents that must be added on top of the subtotal.
   * 0 for fully tax-inclusive quotes, equals taxAmountCents for fully
   * tax-exclusive quotes, between the two for mixed zones.
   */
  taxAddedCents?: number;
  /** True when intra-EU B2B reverse charge applied — customer self-accounts VAT. */
  reverseChargeApplied?: boolean;
  /** Echo of the customer VAT number used for the reverse-charge quote. */
  vatNumber?: string;
  /** Named tax regime that governed the quote (explainability). */
  taxRegime?: TaxRegime;
  /** Version marker for the tax policy/engine that produced the quote. */
  taxPolicyVersion?: string;
  /** Explainable decision record — inputs + regime + outcome for order logs. */
  decisionRecord?: PolicyDecisionRecord;
  message?: string;
}

/** Version marker for the internal rule-based tax engine. */
export const TAX_POLICY_VERSION = 'internal-rules@1.0.0';

export interface LineTaxContext {
  items: OrderLineItem[];
  address: AddressInput;
  pricesIncludeTax: boolean;
  defaultTaxRate: number;
  defaultRateInfo: TaxRateInfo | null;
  reverseChargeApplied: boolean;
  noNexusObligation: boolean;
  exemptions: TaxExemption[];
  subtotal: number;
}

export interface QuoteContext {
  subtotal: number;
  lineItems: TaxLineItem[];
  hasAnyExemption: boolean;
  shippingTax: { amountCents: number; included: boolean };
  embeddedTaxCents: number;
  addedTaxCents: number;
  defaultTaxRate: number;
  originCountry?: string;
  destinationCountry: string;
  reverseChargeApplied: boolean;
  noNexusObligation: boolean;
}

export function taxQuoteMessage(flags: {
  reverseChargeApplied: boolean;
  noNexusObligation: boolean;
  hasAnyExemption: boolean;
}): string | undefined {
  if (flags.reverseChargeApplied) return 'Reverse charge: VAT accounted for by the customer';
  if (flags.noNexusObligation) return 'No tax collection nexus in the destination jurisdiction';
  if (flags.hasAnyExemption) return 'Tax exemption applied';
  return undefined;
}
