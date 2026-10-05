/**
 * Get Product Variants Use Case
 */

import type { ProductVariantFilters, ProductVariantPort, ProductVariantRow } from '../../domain/repositories/ProductCatalogPorts';
import type { ProductPricingPort, ProductPriceInfo } from '../ports/ProductPricingPort';
import type { StockAvailabilityPort } from '../ports/StockAvailabilityPort';
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
    private readonly stockAvailabilityPort?: StockAvailabilityPort,
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

    // Inventory-owned availability: the catalog row carries no real stock
    // count, so tracked/backorderable variants resolve live quantities
    // through the inventory port. `unlimited` variants need no lookup.
    const stockByVariantId = new Map<string, { totalAvailable: number; available: boolean }>();
    if (this.stockAvailabilityPort) {
      await Promise.all(
        result.data.map(async variant => {
          // Legacy rows have a NULL policy; they behave as tracked.
          if ((variant.inventoryPolicy ?? 'tracked') === 'unlimited') return;
          try {
            const stock = await this.stockAvailabilityPort!.checkAvailability({
              productId: variant.productId,
              productVariantId: variant.variantId,
              quantity: 1,
            });
            stockByVariantId.set(variant.variantId, { totalAvailable: stock.totalAvailable, available: stock.available });
          } catch {
            // Availability enrichment is best-effort — keep catalog values.
          }
        }),
      );
    }

    return result.data.map((variant: ProductVariantRow) => {
      const priceInfo = priceByVariantId.get(variant.variantId) ?? productLevel;
      const priceDto = toProductPriceDto(priceInfo);
      const stock = stockByVariantId.get(variant.variantId);
      const policy = variant.inventoryPolicy ?? 'tracked';
      const inventoryQuantity = policy === 'unlimited' ? variant.stockQuantity : (stock?.totalAvailable ?? variant.stockQuantity);
      const isInStock = policy !== 'tracked' || (stock?.available ?? variant.isInStock);
      const isOutOfStock = policy === 'tracked' && !(stock?.available ?? !variant.isOutOfStock);
      const isLowStock = isInStock && !isOutOfStock && inventoryQuantity <= (variant.lowStockThreshold ?? 0);
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
        trackInventory: variant.inventoryPolicy !== 'unlimited',
        inventoryQuantity,
        allowBackorders: variant.inventoryPolicy === 'backorderable',
        lowStockThreshold: variant.lowStockThreshold,
        isDefault: variant.isDefault,
        isActive: variant.isActive,
        sortOrder: variant.position,
        isInStock,
        isLowStock,
        isOutOfStock,
        hasDiscount: priceDto?.isOnSale ?? false,
        discountPercentage: priceDto?.isOnSale ? priceDto.discountPercentage : undefined,
      };
    });
  }
}
