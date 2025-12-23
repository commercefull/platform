/**
 * Get Product Variants Use Case
 */

import { ProductVariantRepository, ProductVariantFilters } from '../../infrastructure/repositories/ProductVariantRepository';

export class GetProductVariantsCommand {
  constructor(
    public readonly productId: string,
    public readonly includeInactive?: boolean,
  ) {}
}

export interface ProductVariantResponse {
  variantId: string;
  productId: string;
  sku: string;
  name: string;
  displayName?: string;
  attributes: Array<{
    attributeId: string;
    attributeName: string;
    value: string;
    displayValue?: string;
  }>;
  price: {
    amount: number;
    currency: string;
    saleAmount?: number;
    cost?: number;
  };
  compareAtPrice?: {
    amount: number;
    currency: string;
  };
  trackInventory: boolean;
  inventoryQuantity: number;
  allowBackorders: boolean;
  lowStockThreshold?: number;
  isDefault: boolean;
  isActive: boolean;
  sortOrder: number;
  isInStock: boolean;
  isLowStock: boolean;
  isOutOfStock: boolean;
  hasDiscount: boolean;
  discountPercentage?: number;
}

export class GetProductVariantsUseCase {
  constructor(private readonly variantRepository: ProductVariantRepository) {}

  async execute(command: GetProductVariantsCommand): Promise<ProductVariantResponse[]> {
    const filters: ProductVariantFilters = {
      productId: command.productId,
    };

    if (command.includeInactive !== true) {
      filters.isActive = true;
    }

    const result = await this.variantRepository.findAll(filters, {
      limit: 100, // Reasonable limit for variants
      orderBy: 'sortOrder',
      orderDirection: 'asc',
    });

    return result.data.map(variant => ({
      variantId: variant.variantId,
      productId: variant.productId,
      sku: variant.sku,
      name: variant.name,
      displayName: variant.name, // Use name as displayName
      attributes: variant.attributes.map(attr => ({
        attributeId: attr.attributeId,
        attributeName: attr.attributeName,
        value: attr.value,
        displayValue: attr.displayValue,
      })),
      price: {
        amount: variant.price.effectivePrice,
        currency: variant.price.currency,
        saleAmount: variant.price.salePrice ?? undefined,
        cost: variant.price.cost ?? undefined,
      },
      trackInventory: true, // Always track inventory for variants
      inventoryQuantity: variant.stockQuantity,
      allowBackorders: false, // Not supported in existing entity
      lowStockThreshold: variant.lowStockThreshold,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      sortOrder: variant.position,
      isInStock: variant.isInStock,
      isLowStock: variant.isLowStock,
      isOutOfStock: variant.isOutOfStock,
      hasDiscount: variant.price.isOnSale,
      discountPercentage: variant.price.isOnSale ? variant.price.discountPercentage : undefined,
    }));
  }
}
