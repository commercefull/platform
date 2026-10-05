/**
 * Shared assortment target expansion.
 *
 * Expands an include/exclude entry target to concrete product ids:
 * - `product`    — the target id itself
 * - `collection` — the collection's resolved membership
 * - `category`   — every product in the category
 */

import type { CatalogQueryPort } from '../ports/CatalogQueryPort';
import { ResolveCollectionProductsCommand, type ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';

export interface AssortmentExpansionDeps {
  resolveCollectionProducts: Pick<ResolveCollectionProductsUseCase, 'execute'>;
  catalog: Pick<CatalogQueryPort, 'searchProducts'>;
}

export async function expandAssortmentTarget(deps: AssortmentExpansionDeps, targetType: string, targetId: string): Promise<string[]> {
  switch (targetType) {
    case 'product':
      return [targetId];
    case 'collection': {
      const resolved = await deps.resolveCollectionProducts.execute(new ResolveCollectionProductsCommand(targetId, 1000, 0));
      return resolved.products.map(p => p.productId);
    }
    case 'category': {
      const result = await deps.catalog.searchProducts({ categoryId: targetId }, 1000, 0);
      return result.products.map(p => p.productId);
    }
    default:
      return [];
  }
}
