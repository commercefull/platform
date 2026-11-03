/**
 * ProductPricingAdapter — ACL adapter translating the product module's
 * ProductPricingPort onto the pricing module's productBasePrice repository.
 * All amounts crossing this boundary are integer cents.
 */

import type { ProductBasePriceRepository } from '../../../pricing';
import type { ProductBasePrice } from '../../../pricing/domain/catalogPrice';
import type { ProductPricingPort, ProductPriceInfo, SetProductBasePriceInput } from '../../application/ports/ProductPricingPort';

function toPriceInfo(row: ProductBasePrice): ProductPriceInfo {
  return {
    productBasePriceId: row.productBasePriceId,
    productId: row.productId,
    productVariantId: row.productVariantId ?? null,
    currencyCode: row.currencyCode,
    priceCents: row.priceCents,
    salePriceCents: row.salePriceCents ?? null,
    compareAtPriceCents: row.compareAtPriceCents ?? null,
    costPriceCents: row.costPriceCents ?? null,
    updatedAt: row.updatedAt,
  };
}

export class ProductPricingAdapter implements ProductPricingPort {
  constructor(private readonly productBasePriceRepo: ProductBasePriceRepository) {}

  async getBasePrice(productId: string, productVariantId?: string | null, currencyCode?: string): Promise<ProductPriceInfo | null> {
    const row = await this.productBasePriceRepo.findEffective(productId, productVariantId ?? undefined, currencyCode);
    return row ? toPriceInfo(row) : null;
  }

  async getBasePrices(productIds: string[], currencyCode?: string): Promise<ProductPriceInfo[]> {
    const rows = await this.productBasePriceRepo.findForProducts(productIds, currencyCode);
    return rows.map(toPriceInfo);
  }

  async listProductPrices(productId: string): Promise<ProductPriceInfo[]> {
    const rows = await this.productBasePriceRepo.findForProduct(productId);
    return rows.map(toPriceInfo);
  }

  async setBasePrice(input: SetProductBasePriceInput): Promise<ProductPriceInfo> {
    const row = await this.productBasePriceRepo.upsert({
      productId: input.productId,
      productVariantId: input.productVariantId ?? null,
      currencyCode: input.currencyCode,
      priceCents: input.priceCents,
      salePriceCents: input.salePriceCents ?? null,
      compareAtPriceCents: input.compareAtPriceCents ?? null,
      costPriceCents: input.costPriceCents ?? null,
      taxRate: input.taxRate ?? null,
    });
    return toPriceInfo(row);
  }

  async deletePricesForProduct(productId: string): Promise<void> {
    await this.productBasePriceRepo.deleteByProduct(productId);
  }
}
