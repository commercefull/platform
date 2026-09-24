/**
 * CalculatePrices Use Case
 *
 * Batch variant of `CalculatePriceUseCase` — calculates prices for
 * multiple products or variants under a shared context.
 */

import { PriceContext, PricingResult } from '../../domain/pricingRule';
import { CalculatePriceUseCase } from './CalculatePrice';

export interface CalculatePricesInput {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity?: number;
  }>;
  context?: Omit<PriceContext, 'quantity'>;
}

export class CalculatePricesUseCase {
  constructor(private readonly calculatePrice: Pick<CalculatePriceUseCase, 'execute'>) {}

  async execute(input: CalculatePricesInput): Promise<Record<string, PricingResult>> {
    const results: Record<string, PricingResult> = {};

    for (const item of input.items) {
      const key = item.variantId ? `${item.productId}:${item.variantId}` : item.productId;
      results[key] = await this.calculatePrice.execute({
        ...input.context,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity || 1,
      });
    }

    return results;
  }
}
