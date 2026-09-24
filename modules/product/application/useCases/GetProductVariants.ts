/**
 * Get Product Variants Use Case
 */

import type { ProductVariantFilters, ProductVariantPort, ProductVariantRow } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductPricingPort, ProductPriceInfo } from '../ports/ProductPricingPort';
import { toProductPriceDto } from '../dto/productPriceDto';

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
  /** Catalog price from the pricing-owned store — integer cents. */
  price: {
    amountCents: number;
    currency: string;
    saleAmountCents?: number;
    costCents?: number;
  };
  compareAtPriceCents?: number;
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
  constructor(
    private readonly variantRepository: ProductVariantPort,
    private readonly pricingPort: ProductPricingPort,
  ) {}

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

    // Load catalog prices from the pricing-owned store: all rows for the
    // product in one query, then pick the variant-level row (fallback to the
    // product-level row when a variant has no override).
    const priceRows = await this.pricingPort.listProductPrices(command.productId);
    const productLevel = priceRows.find(p => p.productVariantId == null) ?? null;
    const priceByVariantId = new Map<string, ProductPriceInfo>(
      priceRows.filter(p => p.productVariantId != null).map(p => [p.productVariantId as string, p]),
    );

    return result.data.map((variant: ProductVariantRow) => {
      const priceInfo = priceByVariantId.get(variant.variantId) ?? productLevel;
      const priceDto = toProductPriceDto(priceInfo);
      return {
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
          amountCents: priceDto?.effectivePriceCents ?? 0,
          currency: priceDto?.currency ?? 'USD',
          saleAmountCents: priceDto?.salePriceCents ?? undefined,
          costCents: priceDto?.costPriceCents ?? undefined,
        },
        compareAtPriceCents: priceDto?.compareAtPriceCents ?? undefined,
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
        hasDiscount: priceDto?.isOnSale ?? false,
        discountPercentage: priceDto?.isOnSale ? priceDto.discountPercentage : undefined,
      };
    });
  }
}
