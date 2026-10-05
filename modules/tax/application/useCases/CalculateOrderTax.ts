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
import type { AddressInput, CustomerTaxExemption, ExemptionVerdict, TaxExemptionStatus } from '../../taxTypes';

export interface TaxRateInfo {
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

export class CalculateOrderTaxCommand {
  constructor(
    public readonly items: OrderLineItem[],
    public readonly shippingAddress: TaxAddress,
    public readonly shippingAmountCents: number = 0,
    public readonly customerId?: string,
    public readonly pricesIncludeTax: boolean = false,
    /** Customer VAT ID (B2B) — enables intra-EU reverse-charge quoting. */
    public readonly vatNumber?: string,
    /** Seller organization — enables nexus coverage and VAT registration checks. */
    public readonly organizationId?: string,
    /** Seller/origin country (store country) — used to detect cross-border EU sales. */
    public readonly originCountry?: string,
  ) {}
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
  message?: string;
}

/** EU member states (ISO-2) — used for intra-EU B2B reverse charge detection. */
const EU_MEMBER_STATES = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IE',
  'IT',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
]);

// ============================================================================
// Use Case
// ============================================================================

export class CalculateOrderTaxUseCase {
  constructor(private readonly taxQuery: TaxQueryPort) {}

  async execute(command: CalculateOrderTaxCommand): Promise<CalculateOrderTaxResponse> {
    try {
      // Validate input
      if (!command.items || command.items.length === 0) {
        return {
          success: false,
          subtotalCents: 0,
          shippingAmountCents: command.shippingAmountCents,
          taxAmountCents: 0,
          totalCents: command.shippingAmountCents,
          taxRate: 0,
          lineItems: [],
          taxIncludedInSubtotal: command.pricesIncludeTax,
          message: 'No items to calculate tax for',
        };
      }

      if (!command.shippingAddress?.country) {
        return {
          success: false,
          subtotalCents: 0,
          shippingAmountCents: command.shippingAmountCents,
          taxAmountCents: 0,
          totalCents: command.shippingAmountCents,
          taxRate: 0,
          lineItems: [],
          taxIncludedInSubtotal: command.pricesIncludeTax,
          message: 'Shipping address country is required for tax calculation',
        };
      }

      const address = {
        country: command.shippingAddress.country,
        region: command.shippingAddress.region || command.shippingAddress.state,
        postalCode: command.shippingAddress.postalCode,
        city: command.shippingAddress.city,
      };

      // B2B reverse charge: valid customer VAT number for an EU destination
      // different from the seller's origin — the customer self-accounts VAT.
      const destinationCountry = command.shippingAddress.country.toUpperCase();
      let reverseChargeApplied = false;
      if (
        command.vatNumber &&
        EU_MEMBER_STATES.has(destinationCountry) &&
        command.originCountry &&
        command.originCountry.toUpperCase() !== destinationCountry &&
        this.taxQuery.validateCustomerVatNumber
      ) {
        const vatValid = await this.taxQuery.validateCustomerVatNumber(command.vatNumber, destinationCountry);
        const sellerRegistered =
          !command.organizationId || !this.taxQuery.hasActiveVatRegistration
            ? true
            : await this.taxQuery.hasActiveVatRegistration(command.organizationId);
        reverseChargeApplied = vatValid && sellerRegistered;
      }

      // US-style nexus gating: when the organization maintains nexus
      // records, tax is only collected where nexus covers the destination.
      let noNexusObligation = false;
      if (command.organizationId && this.taxQuery.hasNexusCoverage) {
        const covered = await this.taxQuery.hasNexusCoverage(command.organizationId, address);
        noNexusObligation = covered === false;
      }

      // Get the default tax rate for the shipping address (backward compat)
      const defaultTaxRate = reverseChargeApplied || noNexusObligation ? 0 : await this.taxQuery.getTaxRateForAddress(address);
      const defaultRateInfo = this.taxQuery.getTaxRateInfoForAddress ? await this.taxQuery.getTaxRateInfoForAddress(address) : null;

      // Load customer tax exemptions and convert to domain entities
      let exemptions: TaxExemption[] = [];
      if (command.customerId) {
        const rawExemptions = await this.taxQuery.findCustomerTaxExemptions(command.customerId, 'approved');
        exemptions = rawExemptions.map(e => this.toDomainEntity(e));
      }

      // Calculate subtotal first (needed for exemption amount-bounds checks)
      const subtotal = command.items.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);

      // Calculate tax for each line item
      const lineItems: TaxLineItem[] = [];
      let hasAnyExemption = false;
      let embeddedTaxCents = 0;
      let addedTaxCents = 0;

      for (const item of command.items) {
        const itemSubtotal = item.quantity * item.unitPriceCents;

        // Skip non-taxable items
        if (item.taxable === false) {
          lineItems.push({
            productId: item.productId,
            name: item.name,
            subtotalCents: itemSubtotal,
            taxAmountCents: 0,
            taxRate: 0,
          });
          continue;
        }

        // Get the tax rate for this item's category (per-category lookup, Epic B5)
        let itemTaxRate = defaultTaxRate;
        let itemRateInfo = defaultRateInfo;
        if (item.taxCategoryId && !reverseChargeApplied && !noNexusObligation) {
          const categoryRate = await this.taxQuery.getTaxRateForAddressAndCategory(address, item.taxCategoryId);
          // Only use the category rate if it's non-zero (zero means no specific rate found)
          if (categoryRate > 0) {
            itemTaxRate = categoryRate;
            itemRateInfo = this.taxQuery.getTaxRateInfoForAddress
              ? await this.taxQuery.getTaxRateInfoForAddress(address, item.taxCategoryId)
              : null;
          }
        }
        // The org-wide setting forces inclusion; otherwise the applied rate's
        // own includeInPrice flag decides (UK/EU VAT zones are inclusive even
        // when the org default is tax-exclusive).
        const lineIncluded = command.pricesIncludeTax || itemRateInfo?.includeInPrice === true;

        // Evaluate exemption for this line item (Epic B4)
        let exemptionMultiplier = 1; // 1 = full tax, 0 = fully exempt
        let exemptionVerdict: ExemptionVerdict | undefined;

        if (exemptions.length > 0) {
          // Find the best exemption for this line item (most specific: matching category)
          const result = this.evaluateExemption(exemptions, item.taxCategoryId, subtotal);

          if (result) {
            exemptionMultiplier = result.multiplier;
            exemptionVerdict = result.verdict;
            if (exemptionMultiplier < 1) hasAnyExemption = true;
          }
        }

        const effectiveRate = itemTaxRate * exemptionMultiplier;
        const itemTaxAmount = lineIncluded ? itemSubtotal - itemSubtotal / (1 + effectiveRate / 100) : (itemSubtotal * effectiveRate) / 100;
        const roundedItemTax = Math.round(itemTaxAmount);
        if (lineIncluded) embeddedTaxCents += roundedItemTax;
        else addedTaxCents += roundedItemTax;

        lineItems.push({
          productId: item.productId,
          name: item.name,
          subtotalCents: itemSubtotal,
          taxAmountCents: roundedItemTax,
          taxRate: exemptionMultiplier < 1 ? itemTaxRate * exemptionMultiplier : itemTaxRate,
          exemptionVerdict,
        });
      }

      // Calculate tax on shipping (if applicable and not fully exempt)
      const shippingExemptionMultiplier = this.shippingExemptionMultiplier(exemptions, subtotal);
      const effectiveShippingRate = defaultTaxRate * shippingExemptionMultiplier;
      const shippingIncluded = command.pricesIncludeTax || defaultRateInfo?.includeInPrice === true;
      const shippingTaxAmountCents = Math.round(
        shippingIncluded
          ? command.shippingAmountCents - command.shippingAmountCents / (1 + effectiveShippingRate / 100)
          : (command.shippingAmountCents * effectiveShippingRate) / 100,
      );
      if (shippingIncluded) embeddedTaxCents += shippingTaxAmountCents;
      else addedTaxCents += shippingTaxAmountCents;

      // Calculate total tax
      const totalTaxAmountCents = embeddedTaxCents + addedTaxCents;
      const taxIncludedInSubtotal = addedTaxCents > 0 ? false : command.pricesIncludeTax || embeddedTaxCents > 0;

      // Grand total: embedded tax is already inside subtotal/shipping; only
      // the added portion increases the total.
      const totalCents = subtotal + command.shippingAmountCents + addedTaxCents;

      return {
        success: true,
        subtotalCents: subtotal,
        shippingAmountCents: command.shippingAmountCents,
        taxAmountCents: totalTaxAmountCents,
        totalCents,
        taxRate: defaultTaxRate,
        lineItems,
        taxIncludedInSubtotal,
        taxAddedCents: addedTaxCents,
        reverseChargeApplied: reverseChargeApplied || undefined,
        vatNumber: reverseChargeApplied ? command.vatNumber : undefined,
        message: reverseChargeApplied
          ? 'Reverse charge: VAT accounted for by the customer'
          : noNexusObligation
            ? 'No tax collection nexus in the destination jurisdiction'
            : hasAnyExemption
              ? 'Tax exemption applied'
              : undefined,
      };
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
