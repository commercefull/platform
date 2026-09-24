/**
 * ProductPricingAdapter — ACL adapter translating the product module's
 * ProductPricingPort onto the pricing module's productBasePrice repository.
 * All amounts crossing this boundary are integer cents.
 */

import productBasePriceRepo from '../../../pricing/infrastructure/repositories/productBasePriceRepo';
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
  async getBasePrice(productId: string, productVariantId?: string | null, currencyCode?: string): Promise<ProductPriceInfo | null> {
    const row = await productBasePriceRepo.findEffective(productId, productVariantId ?? undefined, currencyCode);
    return row ? toPriceInfo(row) : null;
  }

  async getBasePrices(productIds: string[], currencyCode?: string): Promise<ProductPriceInfo[]> {
    const rows = await productBasePriceRepo.findForProducts(productIds, currencyCode);
    return rows.map(toPriceInfo);
  }

  async listProductPrices(productId: string): Promise<ProductPriceInfo[]> {
    const rows = await productBasePriceRepo.findForProduct(productId);
    return rows.map(toPriceInfo);
  }

  async setBasePrice(input: SetProductBasePriceInput): Promise<ProductPriceInfo> {
    const row = await productBasePriceRepo.upsert({
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
    await productBasePriceRepo.deleteByProduct(productId);
  }
}
