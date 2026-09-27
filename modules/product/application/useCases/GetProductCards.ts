/**
 * Get Product Cards Use Case
 * Batch resolves lightweight product cards for cross-module consumers
 * (recommendation serving, feeds). Shaped to render the storefront
 * `product-card` partial directly: integer-cent prices, primary image.
 */

import type { ProductRepository } from '../../domain/repositories/ProductRepository';
import type { ProductPricingPort, ProductPriceInfo } from '../ports/ProductPricingPort';
import type { Product } from '../../domain/entities/Product';

export interface ProductCardResponse {
  productId: string;
  name: string;
  slug: string;
  sku?: string;
  status: string;
  visibility: string;
  organizationId?: string;
  storeId?: string;
  basePriceCents: number;
  salePriceCents: number | null;
  effectivePriceCents: number;
  isOnSale: boolean;
  isFeatured: boolean;
  hasVariants: boolean;
  isInventoryManaged: boolean;
  primaryImageUrl?: string;
  currency?: string;
}

export class GetProductCardsCommand {
  constructor(
    public readonly productIds: string[],
    public readonly currencyCode?: string,
  ) {}
}

export class GetProductCardsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly pricingPort: ProductPricingPort,
  ) {}

  async execute(command: GetProductCardsCommand): Promise<ProductCardResponse[]> {
    const ids = [...new Set(command.productIds.filter(Boolean))];
    if (ids.length === 0) return [];

    const [products, prices] = await Promise.all([
      this.productRepository.findByIds(ids),
      this.pricingPort.getBasePrices(ids, command.currencyCode).catch(() => [] as ProductPriceInfo[]),
    ]);

    const priceByProduct = new Map<string, ProductPriceInfo>();
    for (const p of prices || []) {
      if (p.productVariantId === null) priceByProduct.set(p.productId, p);
    }

    const byId = new Map(products.map(p => [p.productId, p]));
    // Preserve the caller's ordering (candidate rank order)
    return ids
      .map(id => byId.get(id))
      .filter((p): p is Product => !!p)
      .map(p => this.toCard(p, priceByProduct.get(p.productId)));
  }

  private toCard(product: Product, price?: ProductPriceInfo): ProductCardResponse {
    const base = price?.priceCents ?? 0;
    const sale = price?.salePriceCents ?? null;
    const effective = sale ?? base;
    const primaryImage = product.images.find(img => img.isPrimary) ?? product.images[0];
    return {
      productId: product.productId,
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      status: product.status,
      visibility: product.visibility,
      organizationId: product.organizationId,
      storeId: product.storeId,
      basePriceCents: base,
      salePriceCents: sale,
      effectivePriceCents: effective,
      isOnSale: sale !== null && sale < base,
      isFeatured: product.isFeatured,
      hasVariants: product.hasVariants ?? false,
      isInventoryManaged: product.isInventoryManaged ?? false,
      primaryImageUrl: primaryImage?.url,
      currency: price?.currencyCode,
    };
  }
}
