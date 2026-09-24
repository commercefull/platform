/**
 * SetProductPrice Use Case
 *
 * Writes a product's base price into the pricing-owned productBasePrice
 * store. All monetary amounts are integer cents.
 */

import { InvalidPriceError, PriceMustBePositiveError, PricingValidationError } from '../../domain/errors/PricingErrors';

export interface SetProductPriceInput {
  productId: string;
  variantId?: string;
  priceListId?: string;
  priceCents: number;
  salePriceCents?: number;
  currencyCode?: string;
}

export interface SetProductPriceOutput {
  productId: string;
  variantId?: string;
  priceCents: number;
  salePriceCents?: number;
  updatedAt: string;
}

interface SetProductPriceRepositoryPort {
  setPrice(data: {
    productId: string;
    variantId?: string;
    priceListId?: string;
    priceCents: number;
    salePriceCents?: number;
    currencyCode: string;
  }): Promise<{ productId: string; variantId?: string; priceCents: number; salePriceCents?: number | null; updatedAt: Date }>;
}

export class SetProductPriceUseCase {
  constructor(private readonly pricingRepository: SetProductPriceRepositoryPort) {}

  async execute(input: SetProductPriceInput): Promise<SetProductPriceOutput> {
    if (!input.productId || input.priceCents === undefined) {
      throw new PricingValidationError('Product ID and price are required');
    }

    if (!Number.isInteger(input.priceCents) || input.priceCents < 0) {
      throw new PriceMustBePositiveError();
    }

    if (input.salePriceCents !== undefined) {
      if (!Number.isInteger(input.salePriceCents) || input.salePriceCents < 0) {
        throw new InvalidPriceError('Sale price must be a non-negative integer amount of cents');
      }
      if (input.salePriceCents >= input.priceCents) {
        throw new InvalidPriceError('Sale price must be less than regular price');
      }
    }

    const priceRecord = await this.pricingRepository.setPrice({
      productId: input.productId,
      variantId: input.variantId,
      priceListId: input.priceListId,
      priceCents: input.priceCents,
      salePriceCents: input.salePriceCents,
      currencyCode: input.currencyCode || 'USD',
    });

    return {
      productId: priceRecord.productId,
      variantId: priceRecord.variantId,
      priceCents: priceRecord.priceCents,
      salePriceCents: priceRecord.salePriceCents ?? undefined,
      updatedAt: priceRecord.updatedAt.toISOString(),
    };
  }
}
