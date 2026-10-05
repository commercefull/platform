/**
 * Browse Collections Use Case
 *
 * Public/customer-facing reads: list published collections and resolve a
 * collection page (metadata + products) by slug.
 */

import type { Collection } from '../../domain/entities/Collection';
import type { CollectionRepository, CollectionScope } from '../../domain/repositories/AssortmentRepository';
import { ResolveCollectionProductsCommand, type ResolveCollectionProductsUseCase } from './ResolveCollectionProducts';
import type { CatalogProductRef } from '../ports/CatalogQueryPort';
import { CollectionNotFoundError } from '../../domain/errors/AssortmentErrors';

export interface PublicCollectionDto {
  assortmentCollectionId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  bannerUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  isFeatured: boolean;
}

export interface CollectionPageResponse {
  collection: PublicCollectionDto;
  products: CatalogProductRef[];
  total: number;
}

function toPublicDto(collection: Collection): PublicCollectionDto {
  return {
    assortmentCollectionId: collection.assortmentCollectionId,
    name: collection.name,
    slug: collection.slug,
    description: collection.description,
    imageUrl: collection.imageUrl,
    bannerUrl: collection.bannerUrl,
    metaTitle: collection.metaTitle,
    metaDescription: collection.metaDescription,
    isFeatured: collection.isFeatured,
  };
}

export class BrowseCollectionsUseCase {
  constructor(
    private readonly collectionRepo: CollectionRepository,
    private readonly resolveCollectionProducts: ResolveCollectionProductsUseCase,
  ) {}

  async list(organizationId?: string, scope?: CollectionScope): Promise<PublicCollectionDto[]> {
    const collections = await this.collectionRepo.findAll({ isActive: true, organizationId });
    const published = collections.filter(c => c.isPublished());
    if (!scope?.storeId && !scope?.channelId) {
      return published.map(toPublicDto);
    }
    const placements = await this.collectionRepo.resolveVisibleCollections(scope);
    const positionById = new Map(placements.map(p => [p.assortmentCollectionId, p.sortOrder] as const));
    return published
      .filter(c => positionById.has(c.assortmentCollectionId))
      .sort(
        (a, b) =>
          (positionById.get(a.assortmentCollectionId) ?? Number.MAX_SAFE_INTEGER) -
          (positionById.get(b.assortmentCollectionId) ?? Number.MAX_SAFE_INTEGER),
      )
      .map(toPublicDto);
  }

  async getBySlug(
    slug: string,
    limit = 50,
    offset = 0,
    sellable?: { includeProductIds?: string[]; excludeProductIds?: string[] },
    scope?: CollectionScope,
  ): Promise<CollectionPageResponse> {
    const collection = await this.collectionRepo.findBySlug(slug);
    if (!collection || !collection.isPublished()) {
      throw new CollectionNotFoundError(slug);
    }
    if (scope?.storeId || scope?.channelId) {
      const placements = await this.collectionRepo.resolveVisibleCollections(scope);
      if (!placements.some(p => p.assortmentCollectionId === collection.assortmentCollectionId)) {
        throw new CollectionNotFoundError(slug);
      }
    }
    const resolved = await this.resolveCollectionProducts.execute(
      new ResolveCollectionProductsCommand(collection.assortmentCollectionId, limit, offset, sellable),
    );
    return {
      collection: toPublicDto(collection),
      products: resolved.products,
      total: resolved.total,
    };
  }
}
