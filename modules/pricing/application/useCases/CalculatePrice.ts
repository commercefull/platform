/**
 * CalculatePrice Use Case
 * 
 * Calculates the final price for a product considering all pricing rules.
 */

export interface CalculatePriceInput {
  productId: string;
  variantId?: string;
  quantity: number;
  customerId?: string;
  companyId?: string;
  channelId?: string;
  storeId?: string;
  priceListId?: string;
}

export interface PriceBreakdown {
  basePrice: number;
  salePrice?: number;
  volumeDiscount?: number;
  customerDiscount?: number;
  finalPrice: number;
  currency: string;
  appliedRules: string[];
}

export interface CalculatePriceOutput {
  unitPrice: number;
  totalPrice: number;
  currency: string;
  breakdown: PriceBreakdown;
}

export class CalculatePriceUseCase {
  constructor(
    private readonly pricingRepository: any,
    private readonly productRepository: any
  ) {}

  async execute(input: CalculatePriceInput): Promise<CalculatePriceOutput> {
    // Get product base price
    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new Error(`Product not found: ${input.productId}`);
    }

    let basePrice = product.price;
    const appliedRules: string[] = [];
    let finalPrice = basePrice;

    // Get variant price if applicable
    if (input.variantId) {
      const variant = await this.productRepository.findVariantById(input.variantId);
      if (variant?.price) {
        basePrice = variant.price;
        finalPrice = basePrice;
      }
    }

    // Check for price list override
    if (input.priceListId) {
      const priceListItem = await this.pricingRepository.getPriceListItem(
        input.priceListId,
        input.productId,
        input.variantId
      );
      if (priceListItem) {
        finalPrice = priceListItem.price;
        appliedRules.push(`price_list:${input.priceListId}`);
      }
    }

    // Check for B2B company pricing
    if (input.companyId) {
      const companyPrice = await this.pricingRepository.getCompanyPrice(
        input.companyId,
        input.productId,
        input.variantId
      );
      if (companyPrice) {
        finalPrice = companyPrice.price;
        appliedRules.push(`b2b_company:${input.companyId}`);
      }
    }

    // Check for volume discounts
    if (input.quantity > 1) {
      const volumeDiscount = await this.pricingRepository.getVolumeDiscount(
        input.productId,
        input.quantity
      );
      if (volumeDiscount) {
        const discountAmount = finalPrice * (volumeDiscount.discountPercent / 100);
        finalPrice = finalPrice - discountAmount;
        appliedRules.push(`volume_discount:${volumeDiscount.discountPercent}%`);
      }
    }

    // Calculate sale price if active
    const salePrice = await this.pricingRepository.getActiveSalePrice(
      input.productId,
      input.variantId
    );
    if (salePrice && salePrice < finalPrice) {
      finalPrice = salePrice;
      appliedRules.push('sale_price');
    }

    const totalPrice = finalPrice * input.quantity;

    return {
      unitPrice: finalPrice,
      totalPrice,
      currency: product.currencyCode || 'USD',
      breakdown: {
        basePrice,
        salePrice,
        finalPrice,
        currency: product.currencyCode || 'USD',
        appliedRules,
      },
    };
  }
}
