/**
 * CatalogQueryPort
 *
 * ACL port owned by assortment. Queries the product catalog for rule
 * evaluation and store-catalog resolution — implemented by an adapter
 * over product's ListProductsUseCase + product repository.
 */

import type { CatalogQueryFilters } from '../../domain/services/CollectionRuleEvaluator';

export interface CatalogProductRef {
  productId: string;
  name: string;
  slug: string;
  categoryId?: string;
  effectivePriceCents: number;
  isFeatured: boolean;
  primaryImageUrl?: string;
  createdAt?: Date;
}

export interface CatalogQueryResult {
  products: CatalogProductRef[];
  total: number;
}

export interface CatalogQueryPort {
  searchProducts(filters: CatalogQueryFilters, limit: number, offset: number): Promise<CatalogQueryResult>;
  findProductsByIds(productIds: string[]): Promise<CatalogProductRef[]>;
}
