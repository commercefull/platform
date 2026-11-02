/**
 * Calculate Order Tax Use Case
 * Calculates tax for an order based on items, shipping address, and customer exemptions.
 *
 * Epic B: Replaced binary all-or-nothing exemption with per-line-item
 * `TaxExemption.evaluate()` — respects `applicableTaxCategoryIds` (only exempt
 * matching categories), `exemptionPercent` (partial exemption), and amount bounds.
 * Also wires per-`taxCategoryId` rate lookup so the `taxCategoryId` field is no
 * longer silently ignored.
 */

import { TaxExemption } from '../../domain/entities/TaxExemption';
import type { TaxRegime } from '../../domain/entities/TaxDecision';
import type { AddressInput, CustomerTaxExemption, ExemptionVerdict, TaxExemptionStatus } from '../../taxTypes';
import type { PolicyDecisionRecord } from '../../../../libs/rules/policyEngine';
import { isInEuVatArea } from '../../../../libs/geo';

interface TaxRateInfo {
  rate: number;
  includeInPrice: boolean;
}

export interface TaxQueryPort {
  getTaxRateForAddress(address: AddressInput): Promise<number>;
  getTaxRateForAddressAndCategory(address: AddressInput, taxCategoryId?: string): Promise<number>;
  /**
   * Optional richer rate lookup — returns the applied rate together with its
   * `includeInPrice` flag so VAT-inclusive zones (UK/EU) can be quoted
   * independently of the organization-wide `pricesIncludeTax` setting.
   */
  getTaxRateInfoForAddress?(address: AddressInput, taxCategoryId?: string): Promise<TaxRateInfo | null>;
  findCustomerTaxExemptions(customerId: string, status: TaxExemptionStatus): Promise<CustomerTaxExemption[]>;
  /** Optional — validates a customer VAT number against the destination country. */
  validateCustomerVatNumber?(vatNumber: string, destinationCountry: string): Promise<boolean>;
  /** Optional — whether the organization holds an active VAT registration. */
  hasActiveVatRegistration?(organizationId: string): Promise<boolean>;
  /**
   * Optional — nexus coverage for the destination. Null means the org has no
   * nexus records configured (permissive); false means nexus exists but does
   * not cover the destination (no tax collection obligation).
   */
  hasNexusCoverage?(organizationId: string, address: AddressInput): Promise<boolean | null>;
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

interface TaxLineItem {
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
const TAX_POLICY_VERSION = 'internal-rules@1.0.0';

interface LineTaxContext {
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

interface QuoteContext {
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

function taxQuoteMessage(flags: {
  reverseChargeApplied: boolean;
  noNexusObligation: boolean;
  hasAnyExemption: boolean;
}): string | undefined {
  if (flags.reverseChargeApplied) return 'Reverse charge: VAT accounted for by the customer';
  if (flags.noNexusObligation) return 'No tax collection nexus in the destination jurisdiction';
  if (flags.hasAnyExemption) return 'Tax exemption applied';
  return undefined;
}

// ============================================================================
// Use Case
// ============================================================================

export class CalculateOrderTaxUseCase {
  constructor(private readonly taxQuery: TaxQueryPort) {}

  async execute(command: CalculateOrderTaxCommand): Promise<CalculateOrderTaxResponse> {
    try {
      // Validate input
      if (!command.items || command.items.length === 0) {
        return this.noTaxResponse(command, 'No items to calculate tax for');
      }

      // Digital goods / services have no ship-to: fall back to the billing
      // address when no shipping destination was supplied.
      const destination = this.resolveDestination(command);
      if (!destination) {
        return this.noTaxResponse(command, 'A destination (shipping or billing) country is required for tax calculation');
      }
      const { address, destinationCountry } = destination;

      // Origin: per-fulfillment ship-from wins over the store-level originCountry.
      const originCountry = command.shipFromAddress?.country ?? command.originCountry;
      const reverseChargeApplied = await this.evaluateReverseCharge(command, destinationCountry, originCountry);
      const noNexusObligation = await this.checkNexusObligation(command, address);

      // Get the default tax rate for the shipping address (backward compat)
      const defaultTaxRate = reverseChargeApplied || noNexusObligation ? 0 : await this.taxQuery.getTaxRateForAddress(address);
      const defaultRateInfo = this.taxQuery.getTaxRateInfoForAddress ? await this.taxQuery.getTaxRateInfoForAddress(address) : null;

      const exemptions = await this.loadCustomerExemptions(command.customerId);

      // Calculate subtotal first (needed for exemption amount-bounds checks)
      const subtotal = command.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

      const lineTaxes = await this.computeLineItemTaxes({
        items: command.items,
        address,
        pricesIncludeTax: command.pricesIncludeTax,
        defaultTaxRate,
        defaultRateInfo,
        reverseChargeApplied,
        noNexusObligation,
        exemptions,
        subtotal,
      });
      const { lineItems, hasAnyExemption } = lineTaxes;

      // Calculate tax on shipping (if applicable and not fully exempt)
      const shippingTax = this.computeShippingTax(command, defaultTaxRate, defaultRateInfo, exemptions, subtotal);

      return this.toQuoteResponse(command, {
        subtotal,
        lineItems,
        hasAnyExemption,
        shippingTax,
        embeddedTaxCents: lineTaxes.embeddedTaxCents,
        addedTaxCents: lineTaxes.addedTaxCents,
        defaultTaxRate,
        originCountry,
        destinationCountry,
        reverseChargeApplied,
        noNexusObligation,
      });
    } catch (error: unknown) {
      // Return a safe fallback with zero tax
      const subtotal = command.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

      return {
        success: false,
        subtotalCents: subtotal,
        shippingAmountCents: command.shippingAmountCents,
        taxAmountCents: 0,
        totalCents: subtotal + command.shippingAmountCents,
        taxRate: 0,
        lineItems: command.items.map(item => ({
          productId: item.productId,
          name: item.name,
          subtotalCents: item.quantity * item.unitPriceCents,
          taxAmountCents: 0,
          taxRate: 0,
        })),
        taxIncludedInSubtotal: command.pricesIncludeTax,
        message: (error as Error).message || 'Failed to calculate tax',
      };
    }
  }

  private resolveDestination(command: CalculateOrderTaxCommand): { address: AddressInput; destinationCountry: string } | null {
    const destinationAddress = command.shippingAddress?.country || !command.billToAddress ? command.shippingAddress : command.billToAddress;
    if (!destinationAddress?.country) return null;
    return {
      address: {
        country: destinationAddress.country,
        region: destinationAddress.region || destinationAddress.state,
        postalCode: destinationAddress.postalCode,
        city: destinationAddress.city,
      },
      destinationCountry: destinationAddress.country.toUpperCase(),
    };
  }

  private noTaxResponse(command: CalculateOrderTaxCommand, message: string): CalculateOrderTaxResponse {
    return {
      success: false,
      subtotalCents: 0,
      shippingAmountCents: command.shippingAmountCents,
      taxAmountCents: 0,
      totalCents: command.shippingAmountCents,
      taxRate: 0,
      lineItems: [],
      taxIncludedInSubtotal: command.pricesIncludeTax,
      message,
    };
  }

  /** Fold item + shipping taxes into totals, classify the regime, and build the quote response. */
  private toQuoteResponse(command: CalculateOrderTaxCommand, quote: QuoteContext): CalculateOrderTaxResponse {
    const embeddedTaxCents = quote.embeddedTaxCents + (quote.shippingTax.included ? quote.shippingTax.amountCents : 0);
    const addedTaxCents = quote.addedTaxCents + (quote.shippingTax.included ? 0 : quote.shippingTax.amountCents);
    const totalTaxAmountCents = embeddedTaxCents + addedTaxCents;
    const taxIncludedInSubtotal = addedTaxCents > 0 ? false : command.pricesIncludeTax || embeddedTaxCents > 0;
    // Grand total: embedded tax is already inside subtotal/shipping; only
    // the added portion increases the total.
    const totalCents = quote.subtotal + command.shippingAmountCents + addedTaxCents;
    const taxRegime = this.determineRegime(quote);
    const decisionRecord = this.buildDecisionRecord(command, {
      originCountry: quote.originCountry,
      destinationCountry: quote.destinationCountry,
      taxRegime,
      reverseChargeApplied: quote.reverseChargeApplied,
      noNexusObligation: quote.noNexusObligation,
      totalTaxAmountCents,
      addedTaxCents,
    });
    return {
      success: true,
      subtotalCents: quote.subtotal,
      shippingAmountCents: command.shippingAmountCents,
      taxAmountCents: totalTaxAmountCents,
      totalCents,
      taxRate: quote.defaultTaxRate,
      lineItems: quote.lineItems,
      taxIncludedInSubtotal,
      taxAddedCents: addedTaxCents,
      reverseChargeApplied: quote.reverseChargeApplied || undefined,
      vatNumber: quote.reverseChargeApplied ? command.vatNumber : undefined,
      taxRegime,
      taxPolicyVersion: TAX_POLICY_VERSION,
      decisionRecord,
      message: taxQuoteMessage(quote),
    };
  }

  /**
   * B2B reverse charge: valid customer VAT number for an EU destination
   * different from the seller's origin — the customer self-accounts VAT.
   */
  private async evaluateReverseCharge(
    command: CalculateOrderTaxCommand,
    destinationCountry: string,
    originCountry?: string,
  ): Promise<boolean> {
    if (
      !command.vatNumber ||
      !isInEuVatArea(destinationCountry) ||
      !originCountry ||
      originCountry.toUpperCase() === destinationCountry ||
      !this.taxQuery.validateCustomerVatNumber
    ) {
      return false;
    }
    const vatValid = await this.taxQuery.validateCustomerVatNumber(command.vatNumber, destinationCountry);
    const sellerRegistered =
      !command.organizationId || !this.taxQuery.hasActiveVatRegistration
        ? true
        : await this.taxQuery.hasActiveVatRegistration(command.organizationId);
    return vatValid && sellerRegistered;
  }

  /**
   * US-style nexus gating: when the organization maintains nexus
   * records, tax is only collected where nexus covers the destination.
   */
  private async checkNexusObligation(command: CalculateOrderTaxCommand, address: AddressInput): Promise<boolean> {
    if (!command.organizationId || !this.taxQuery.hasNexusCoverage) return false;
    const covered = await this.taxQuery.hasNexusCoverage(command.organizationId, address);
    return covered === false;
  }

  /** Load customer tax exemptions and convert to domain entities. */
  private async loadCustomerExemptions(customerId?: string): Promise<TaxExemption[]> {
    if (!customerId) return [];
    const rawExemptions = await this.taxQuery.findCustomerTaxExemptions(customerId, 'approved');
    return rawExemptions.map(e => this.toDomainEntity(e));
  }

  /** Calculate tax for each line item and bucket it as embedded vs added. */
  private async computeLineItemTaxes(ctx: LineTaxContext): Promise<{
    lineItems: TaxLineItem[];
    hasAnyExemption: boolean;
    embeddedTaxCents: number;
    addedTaxCents: number;
  }> {
    const lineItems: TaxLineItem[] = [];
    let hasAnyExemption = false;
    let embeddedTaxCents = 0;
    let addedTaxCents = 0;

    for (const item of ctx.items) {
      const result = await this.computeItemTax(ctx, item);
      lineItems.push(result.lineItem);
      if (result.embedded) embeddedTaxCents += result.taxAmountCents;
      else addedTaxCents += result.taxAmountCents;
      hasAnyExemption = hasAnyExemption || result.exempted;
    }

    return { lineItems, hasAnyExemption, embeddedTaxCents, addedTaxCents };
  }

  private async computeItemTax(
    ctx: LineTaxContext,
    item: OrderLineItem,
  ): Promise<{ lineItem: TaxLineItem; taxAmountCents: number; embedded: boolean; exempted: boolean }> {
    const itemSubtotal = item.quantity * item.unitPriceCents;

    // Skip non-taxable items
    if (item.taxable === false) {
      return {
        lineItem: { productId: item.productId, name: item.name, subtotalCents: itemSubtotal, taxAmountCents: 0, taxRate: 0 },
        taxAmountCents: 0,
        embedded: false,
        exempted: false,
      };
    }

    // Get the tax rate for this item's category (per-category lookup, Epic B5)
    const { itemTaxRate, itemRateInfo } = await this.resolveItemTaxRate(ctx, item);

    // The org-wide setting forces inclusion; otherwise the applied rate's
    // own includeInPrice flag decides (UK/EU VAT zones are inclusive even
    // when the org default is tax-exclusive).
    const lineIncluded = ctx.pricesIncludeTax || itemRateInfo?.includeInPrice === true;

    // Evaluate exemption for this line item (Epic B4)
    let exemptionMultiplier = 1; // 1 = full tax, 0 = fully exempt
    let exemptionVerdict: ExemptionVerdict | undefined;

    if (ctx.exemptions.length > 0) {
      // Find the best exemption for this line item (most specific: matching category)
      const result = this.evaluateExemption(ctx.exemptions, item.taxCategoryId, ctx.subtotal);
      if (result) {
        exemptionMultiplier = result.multiplier;
        exemptionVerdict = result.verdict;
      }
    }

    const effectiveRate = itemTaxRate * exemptionMultiplier;
    const roundedItemTax = Math.round(
      lineIncluded ? itemSubtotal - itemSubtotal / (1 + effectiveRate / 100) : (itemSubtotal * effectiveRate) / 100,
    );

    return {
      lineItem: {
        productId: item.productId,
        name: item.name,
        subtotalCents: itemSubtotal,
        taxAmountCents: roundedItemTax,
        taxRate: exemptionMultiplier < 1 ? itemTaxRate * exemptionMultiplier : itemTaxRate,
        exemptionVerdict,
      },
      taxAmountCents: roundedItemTax,
      embedded: lineIncluded,
      exempted: exemptionMultiplier < 1,
    };
  }

  private async resolveItemTaxRate(
    ctx: LineTaxContext,
    item: OrderLineItem,
  ): Promise<{ itemTaxRate: number; itemRateInfo: TaxRateInfo | null }> {
    let itemTaxRate = ctx.defaultTaxRate;
    let itemRateInfo = ctx.defaultRateInfo;

    if (item.taxCategoryId && !ctx.reverseChargeApplied && !ctx.noNexusObligation) {
      const categoryRate = await this.taxQuery.getTaxRateForAddressAndCategory(ctx.address, item.taxCategoryId);
      // Only use the category rate if it's non-zero (zero means no specific rate found)
      if (categoryRate > 0) {
        itemTaxRate = categoryRate;
        itemRateInfo = this.taxQuery.getTaxRateInfoForAddress
          ? await this.taxQuery.getTaxRateInfoForAddress(ctx.address, item.taxCategoryId)
          : null;
      }
    }

    return { itemTaxRate, itemRateInfo };
  }

  private computeShippingTax(
    command: CalculateOrderTaxCommand,
    defaultTaxRate: number,
    defaultRateInfo: TaxRateInfo | null,
    exemptions: TaxExemption[],
    subtotal: number,
  ): { amountCents: number; included: boolean } {
    const shippingExemptionMultiplier = this.shippingExemptionMultiplier(exemptions, subtotal);
    const effectiveShippingRate = defaultTaxRate * shippingExemptionMultiplier;
    const included = command.pricesIncludeTax || defaultRateInfo?.includeInPrice === true;
    const amountCents = Math.round(
      included
        ? command.shippingAmountCents - command.shippingAmountCents / (1 + effectiveShippingRate / 100)
        : (command.shippingAmountCents * effectiveShippingRate) / 100,
    );
    return { amountCents, included };
  }

  /**
   * Determine the named tax regime governing the quote — the headline
   * classification persisted on the order's decision log.
   */
  private determineRegime(args: {
    originCountry?: string;
    destinationCountry: string;
    reverseChargeApplied: boolean;
    noNexusObligation: boolean;
    hasAnyExemption: boolean;
  }): TaxRegime {
    const origin = args.originCountry?.toUpperCase();
    const dest = args.destinationCountry.toUpperCase();
    if (args.reverseChargeApplied) return 'EU_B2B_REVERSE_CHARGE';
    if (args.noNexusObligation) return 'US_SALES_TAX_NO_NEXUS';
    if (args.hasAnyExemption) return 'EXEMPT';
    if (dest === 'US') return 'US_SALES_TAX';
    if (dest === 'GB') return 'UK_VAT';
    if (isInEuVatArea(dest)) {
      if (origin && isInEuVatArea(origin)) return origin === dest ? 'EU_VAT_DOMESTIC' : 'EU_VAT_CROSS_BORDER_B2C';
      return 'CROSS_BORDER_IMPORT';
    }
    if (origin && origin === dest) return 'DOMESTIC_TAX';
    return 'CROSS_BORDER_IMPORT';
  }

  /**
   * Build the explainable decision record for the order log — the facts in,
   * the regime out, and the quote summary for audit/replay.
   */
  private buildDecisionRecord(
    command: CalculateOrderTaxCommand,
    summary: {
      originCountry?: string;
      destinationCountry: string;
      taxRegime: TaxRegime;
      reverseChargeApplied: boolean;
      noNexusObligation: boolean;
      totalTaxAmountCents: number;
      addedTaxCents: number;
    },
  ): PolicyDecisionRecord {
    return {
      decisionId: crypto.randomUUID(),
      domain: 'tax',
      decision: 'tax_quote',
      allowed: true,
      version: TAX_POLICY_VERSION,
      reasonCode: 'QUOTE_COMPUTED',
      obligations: [],
      inputs: {
        marketId: command.marketId,
        channelId: command.channelId,
        buyerType: command.buyerType,
        originCountry: summary.originCountry,
        destinationCountry: summary.destinationCountry,
        incoterms: command.incoterms,
        currencyCode: command.currencyCode,
        pricesIncludeTax: command.pricesIncludeTax,
        hasVatNumber: !!command.vatNumber,
      },
      outputs: {
        taxRegime: summary.taxRegime,
        reverseChargeApplied: summary.reverseChargeApplied,
        noNexusObligation: summary.noNexusObligation,
        totalTaxAmountCents: summary.totalTaxAmountCents,
        addedTaxCents: summary.addedTaxCents,
      },
      evaluatedAt: command.transactionTimestamp ?? new Date(),
    };
  }

  /**
   * Convert a raw `CustomerTaxExemption` record to a `TaxExemption` domain entity.
   */
  private toDomainEntity(raw: CustomerTaxExemption): TaxExemption {
    return new TaxExemption({
      id: raw.id,
      customerId: raw.customerId,
      type: raw.type,
      status: raw.status,
      exemptionNumber: raw.exemptionNumber,
      name: raw.name,
      startDate: raw.startDate,
      expiryDate: raw.expiryDate,
      isVerified: raw.isVerified,
      applicableTaxCategoryIds: raw.applicableTaxCategoryIds ?? null,
      minOrderAmountCents: raw.minOrderAmountCents ?? null,
      maxOrderAmountCents: raw.maxOrderAmountCents ?? null,
      exemptionPercent: raw.exemptionPercent ?? 100,
    });
  }

  /**
   * Evaluate exemptions for a line item. Returns the best applicable exemption's
   * multiplier and verdict, or the 'notExempt' verdict if an exemption was
   * checked but didn't apply. Returns `null` only when no exemptions exist.
   */
  private evaluateExemption(
    exemptions: TaxExemption[],
    taxCategoryId: string | undefined,
    orderSubtotal: number,
  ): { multiplier: number; verdict: ExemptionVerdict } | null {
    const context = { taxCategoryId, orderSubtotalCents: orderSubtotal };

    // First, try category-specific exemptions
    if (taxCategoryId) {
      const categoryMatched = exemptions.filter(e => e.appliesToCategory(taxCategoryId));
      for (const e of categoryMatched) {
        const verdict = e.evaluate(context);
        if (verdict === 'exempt' || verdict === 'partiallyExempt') {
          return { multiplier: e.effectiveTaxRateMultiplier(context), verdict };
        }
      }
    }

    // Fall back to any exemption that applies
    for (const e of exemptions) {
      const verdict = e.evaluate(context);
      if (verdict === 'exempt' || verdict === 'partiallyExempt') {
        return { multiplier: e.effectiveTaxRateMultiplier(context), verdict };
      }
    }

    // An exemption was checked but didn't apply — report 'notExempt'
    return { multiplier: 1, verdict: 'notExempt' };
  }

  /**
   * Compute the shipping tax exemption multiplier.
   * If any exemption fully applies (not category-scoped), shipping is also exempt.
   */
  private shippingExemptionMultiplier(exemptions: TaxExemption[], orderSubtotal: number): number {
    for (const e of exemptions) {
      // Category-agnostic exemptions (null applicableTaxCategoryIds) apply to shipping
      if (e.applicableTaxCategoryIds === null || e.applicableTaxCategoryIds === undefined) {
        const multiplier = e.effectiveTaxRateMultiplier({ orderSubtotalCents: orderSubtotal });
        if (multiplier < 1) return multiplier;
      }
    }
    return 1;
  }
}
