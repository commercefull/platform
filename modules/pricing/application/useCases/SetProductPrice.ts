/**
 * SetProductPrice Use Case
 */

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

export class SetProductPriceUseCase {
  constructor(private readonly pricingRepository: any) {}

  async execute(input: SetProductPriceInput): Promise<SetProductPriceOutput> {
    if (!input.productId || input.price === undefined) {
      throw new Error('Product ID and price are required');
    }

    if (input.price < 0) {
      throw new Error('Price cannot be negative');
    }

    if (input.salePrice !== undefined && input.salePrice >= input.price) {
      throw new Error('Sale price must be less than regular price');
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
