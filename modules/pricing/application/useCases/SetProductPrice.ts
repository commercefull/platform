/**
 * SetProductPrice Use Case
 */

import { InvalidPriceError, PriceMustBePositiveError, PricingValidationError } from '../../domain/errors/PricingErrors';

export interface SetProductPriceInput {
  productId: string;
  variantId?: string;
  priceListId?: string;
  price: number;
  salePrice?: number;
  saleStartDate?: Date;
  saleEndDate?: Date;
  currencyCode?: string;
}

export interface SetProductPriceOutput {
  productId: string;
  variantId?: string;
  price: number;
  salePrice?: number;
  updatedAt: string;
}

interface SetProductPriceRepositoryPort {
  setPrice(data: {
    productId: string;
    variantId?: string;
    priceListId?: string;
    price: number;
    salePrice?: number;
    saleStartDate?: Date;
    saleEndDate?: Date;
    currencyCode: string;
  }): Promise<{ productId: string; variantId?: string; price: number; salePrice?: number; updatedAt: Date }>;
}

export class SetProductPriceUseCase {
  constructor(private readonly pricingRepository: SetProductPriceRepositoryPort) {}

  async execute(input: SetProductPriceInput): Promise<SetProductPriceOutput> {
    if (!input.productId || input.price === undefined) {
      throw new PricingValidationError('Product ID and price are required');
    }

    if (input.price < 0) {
      throw new PriceMustBePositiveError();
    }

    if (input.salePrice !== undefined && input.salePrice >= input.price) {
      throw new InvalidPriceError('Sale price must be less than regular price');
    }

    const priceRecord = await this.pricingRepository.setPrice({
      productId: input.productId,
      variantId: input.variantId,
      priceListId: input.priceListId,
      price: input.price,
      salePrice: input.salePrice,
      saleStartDate: input.saleStartDate,
      saleEndDate: input.saleEndDate,
      currencyCode: input.currencyCode || 'USD',
    });

    return {
      productId: priceRecord.productId,
      variantId: priceRecord.variantId,
      price: priceRecord.price,
      salePrice: priceRecord.salePrice,
      updatedAt: priceRecord.updatedAt.toISOString(),
    };
  }
}
