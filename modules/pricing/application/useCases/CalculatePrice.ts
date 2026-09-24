/**
 * CalculatePrice Use Case
 *
 * Calculates the final price for a product considering all pricing rules.
 * All monetary amounts are integer cents — base prices come from the
 * pricing-owned productBasePrice store, never from the product module.
 */

import { PricingValidationError } from '../../domain/errors/PricingErrors';

export interface CalculatePriceInput {
  productId: string;
  variantId?: string;
  quantity: number;
  customerId?: string;
  channelId?: string;
  storeId?: string;
  priceListId?: string;
}

export interface PriceBreakdown {
  basePriceCents: number;
  salePriceCents?: number;
  volumeDiscountCents?: number;
  customerDiscountCents?: number;
  finalPriceCents: number;
  currency: string;
  appliedRules: string[];
}

export interface CalculatePriceOutput {
  unitPriceCents: number;
  totalPriceCents: number;
  currency: string;
  breakdown: PriceBreakdown;
}

export interface BasePriceEntry {
  priceCents: number;
  salePriceCents?: number | null;
  currencyCode: string;
}

interface PricingRepositoryPort {
  /** Base price from the pricing-owned catalog store (variant row wins). */
  getBasePrice(productId: string, variantId?: string): Promise<BasePriceEntry | null>;
  getPriceListItem(priceListId: string, productId: string, variantId?: string): Promise<{ priceCents: number } | null>;
  /** Tier-price override for the requested quantity (integer cents). */
  getTierPrice(productId: string, quantity: number, variantId?: string): Promise<{ priceCents: number } | null>;
}

export class CalculatePriceUseCase {
  constructor(private readonly pricingRepository: PricingRepositoryPort) {}

  async execute(input: CalculatePriceInput): Promise<CalculatePriceOutput> {
    // Get the pricing-owned base price (integer cents)
    const basePrice = await this.pricingRepository.getBasePrice(input.productId, input.variantId);
    if (!basePrice) {
      throw new PricingValidationError(`No base price for product: ${input.productId}`);
    }

    const currency = basePrice.currencyCode || 'USD';
    let finalPriceCents = basePrice.priceCents;
    const appliedRules: string[] = [];

    // Check for price list override
    if (input.priceListId) {
      const priceListItem = await this.pricingRepository.getPriceListItem(input.priceListId, input.productId, input.variantId);
      if (priceListItem) {
        finalPriceCents = priceListItem.priceCents;
        appliedRules.push(`price_list:${input.priceListId}`);
      }
    }

    // Check for tier pricing (quantity-based price override)
    let volumeDiscountCents: number | undefined;
    if (input.quantity > 1) {
      const tierPrice = await this.pricingRepository.getTierPrice(input.productId, input.quantity, input.variantId);
      if (tierPrice && tierPrice.priceCents < finalPriceCents) {
        volumeDiscountCents = finalPriceCents - tierPrice.priceCents;
        finalPriceCents = tierPrice.priceCents;
        appliedRules.push('tier_price');
      }
    }

    // Apply the sale price if it beats the current price
    const salePriceCents = basePrice.salePriceCents ?? undefined;
    if (salePriceCents !== undefined && salePriceCents < finalPriceCents) {
      finalPriceCents = salePriceCents;
      appliedRules.push('sale_price');
    }

    finalPriceCents = Math.max(0, Math.round(finalPriceCents));
    const totalPriceCents = finalPriceCents * input.quantity;

    return {
      unitPriceCents: finalPriceCents,
      totalPriceCents,
      currency,
      breakdown: {
        basePriceCents: basePrice.priceCents,
        salePriceCents,
        volumeDiscountCents,
        finalPriceCents,
        currency,
        appliedRules,
      },
    };
  }
}
