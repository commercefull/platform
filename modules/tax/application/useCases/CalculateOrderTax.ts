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

export interface TaxQueryPort {
  getTaxRateForAddress(address: AddressInput): Promise<number>;
  getTaxRateForAddressAndCategory(address: AddressInput, taxCategoryId?: string): Promise<number>;
  findCustomerTaxExemptions(customerId: string, status: TaxExemptionStatus): Promise<CustomerTaxExemption[]>;
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
  message?: string;
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
        return {
          success: false,
          subtotalCents: 0,
          shippingAmountCents: command.shippingAmountCents,
          taxAmountCents: 0,
          totalCents: command.shippingAmountCents,
          taxRate: 0,
          lineItems: [],
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
          message: 'Shipping address country is required for tax calculation',
        };
      }

      const address = {
        country: command.shippingAddress.country,
        region: command.shippingAddress.region || command.shippingAddress.state,
        postalCode: command.shippingAddress.postalCode,
        city: command.shippingAddress.city,
      };

      // Get the default tax rate for the shipping address (backward compat)
      const defaultTaxRate = await this.taxQuery.getTaxRateForAddress(address);

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
        if (item.taxCategoryId) {
          const categoryRate = await this.taxQuery.getTaxRateForAddressAndCategory(address, item.taxCategoryId);
          // Only use the category rate if it's non-zero (zero means no specific rate found)
          if (categoryRate > 0) {
            itemTaxRate = categoryRate;
          }
        }

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

        const itemTaxAmount = (itemSubtotal * itemTaxRate * exemptionMultiplier) / 100;

        lineItems.push({
          productId: item.productId,
          name: item.name,
          subtotalCents: itemSubtotal,
          taxAmountCents: Math.round(itemTaxAmount),
          taxRate: exemptionMultiplier < 1 ? itemTaxRate * exemptionMultiplier : itemTaxRate,
          exemptionVerdict,
        });
      }

      // Calculate tax on shipping (if applicable and not fully exempt)
      const shippingExemptionMultiplier = this.shippingExemptionMultiplier(exemptions, subtotal);
      const shippingTaxAmountCents = Math.round((command.shippingAmountCents * defaultTaxRate * shippingExemptionMultiplier) / 100);

      // Calculate total tax
      const totalTaxAmountCents = lineItems.reduce((sum, item) => sum + item.taxAmountCents, 0) + shippingTaxAmountCents;

      // Calculate grand total
      const totalCents = subtotal + command.shippingAmountCents + totalTaxAmountCents;

      return {
        success: true,
        subtotalCents: subtotal,
        shippingAmountCents: command.shippingAmountCents,
        taxAmountCents: totalTaxAmountCents,
        totalCents,
        taxRate: defaultTaxRate,
        lineItems,
        message: hasAnyExemption ? 'Tax exemption applied' : undefined,
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
