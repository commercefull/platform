/**
 * Resolve Collection Products Use Case
 *
 * Returns the effective product list for a collection:
 * - manual collections: map entries ordered by position, hydrated via catalog
 * - automated collections: conditions → catalog query filters
 * `sortOrder` applies in both modes (manual = position order).
 */

import type { CollectionRepository, CollectionMapRepository } from '../../domain/repositories/AssortmentRepository';
import type { CatalogQueryPort, CatalogProductRef } from '../ports/CatalogQueryPort';
import { conditionsToFilters } from '../../domain/services/CollectionRuleEvaluator';
import { CollectionNotFoundError } from '../../domain/errors/AssortmentErrors';
import type { Collection } from '../../domain/entities/Collection';

export class ResolveCollectionProductsCommand {
  constructor(
    public readonly assortmentCollectionId: string,
    public readonly limit: number = 100,
    public readonly offset: number = 0,
    /**
     * Optional store/channel sellable-set constraint: `includeProductIds`
     * means "only these", `excludeProductIds` means "never these". Applied
     * before pagination so totals stay accurate.
     */
    public readonly sellable?: { includeProductIds?: string[]; excludeProductIds?: string[] },
  ) {}
}

export interface ResolveCollectionProductsResponse {
  collection: Collection;
  products: CatalogProductRef[];
  total: number;
}

export class ResolveCollectionProductsUseCase {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly collectionMapRepo: CollectionMapRepository,
    private readonly catalog: CatalogQueryPort,
  ) {}

  async execute(command: ResolveCollectionProductsCommand): Promise<ResolveCollectionProductsResponse> {
    const collection = await this.collectionRepo.findById(command.assortmentCollectionId);
    if (!collection) {
      throw new CollectionNotFoundError(command.assortmentCollectionId);
    }

    if (collection.isAutomated) {
      const filters = conditionsToFilters(collection.conditions ?? []);
      filters.sortOrder = collection.sortOrder === 'manual' ? 'newest' : collection.sortOrder;
      if (command.sellable?.includeProductIds) {
        if (command.sellable.includeProductIds.length === 0) {
          return { collection, products: [], total: 0 };
        }
        filters.productIds = command.sellable.includeProductIds;
      }
      if (command.sellable?.excludeProductIds?.length) {
        filters.excludeProductIds = command.sellable.excludeProductIds;
      }
      const result = await this.catalog.searchProducts(filters, command.limit, command.offset);
      return { collection, products: result.products, total: result.total };
    }

    const maps = await this.collectionMapRepo.findByCollection(collection.assortmentCollectionId);
    const sellable = command.sellable;
    const orderedIds = maps
      .map(m => m.productId)
      .filter(
        id => (!sellable?.includeProductIds || sellable.includeProductIds.includes(id)) && !sellable?.excludeProductIds?.includes(id),
      );
    const hydrated = await this.catalog.findProductsByIds(orderedIds);

    const byId = new Map(hydrated.map(p => [p.productId, p]));
    const ordered = orderedIds.map(id => byId.get(id)).filter((p): p is CatalogProductRef => !!p);
    const sorted = applySortOrder(ordered, collection.sortOrder);

    return {
      collection,
      products: sorted.slice(command.offset, command.offset + command.limit),
      total: sorted.length,
    };
  }
}

function applySortOrder(products: CatalogProductRef[], sortOrder: string): CatalogProductRef[] {
  switch (sortOrder) {
    case 'price_asc':
      return [...products].sort((a, b) => a.effectivePriceCents - b.effectivePriceCents);
    case 'price_desc':
      return [...products].sort((a, b) => b.effectivePriceCents - a.effectivePriceCents);
    case 'newest':
      return [...products].sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
    case 'name_asc':
      return [...products].sort((a, b) => a.name.localeCompare(b.name));
    default:
      return products;
  }
}
