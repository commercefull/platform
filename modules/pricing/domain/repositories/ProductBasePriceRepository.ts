/**
 * Product Base Price Repository Port
 *
 * Domain interface for catalog base-price persistence. Implemented by
 * `infrastructure/repositories/productBasePriceRepo`.
 */

import type { ProductBasePrice, ProductBasePriceCreateProps } from '../catalogPrice';

export interface ProductBasePriceRepository {
  findEffective(productId: string, productVariantId?: string, currencyCode?: string): Promise<ProductBasePrice | null>;
  findForProduct(productId: string): Promise<ProductBasePrice[]>;
  findForProducts(productIds: string[], currencyCode?: string): Promise<ProductBasePrice[]>;
  upsert(params: ProductBasePriceCreateProps): Promise<ProductBasePrice>;
  deleteByProduct(productId: string): Promise<void>;
}
