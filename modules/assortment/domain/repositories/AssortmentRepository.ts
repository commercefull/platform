/**
 * Assortment Repository Ports
 *
 * Domain-facing persistence contracts. Implementations live in
 * infrastructure/repositories and are injected via application wired.ts.
 */

import type { Collection } from '../entities/Collection';
import type { CollectionMap } from '../entities/CollectionMap';
import type { StoreAssortment } from '../entities/StoreAssortment';
import type { StoreAssortmentEntry } from '../entities/StoreAssortmentEntry';

export interface CollectionFilters {
  organizationId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface CollectionScope {
  storeId?: string;
  channelId?: string;
}

export interface CollectionPublication {
  assortmentCollectionPublicationId: string;
  assortmentCollectionId: string;
  storeId?: string;
  channelId?: string;
  sortOrder?: number;
}

/** Visibility + merchandising position resolved for one request scope. */
export interface ScopedCollectionPlacement {
  assortmentCollectionId: string;
  /** Scope-specific merchandising order; undefined when the collection is globally visible. */
  sortOrder?: number;
}

export interface CollectionRepository {
  findAll(filters?: CollectionFilters): Promise<Collection[]>;
  findById(assortmentCollectionId: string): Promise<Collection | null>;
  findBySlug(slug: string): Promise<Collection | null>;
  create(collection: Collection): Promise<Collection>;
  update(collection: Collection): Promise<Collection | null>;
  /** Soft delete — sets deletedAt. */
  delete(assortmentCollectionId: string): Promise<boolean>;
  /** Physical remove — used by tests and admin purge flows. */
  hardDelete(assortmentCollectionId: string): Promise<boolean>;
  listPublications(assortmentCollectionId: string): Promise<CollectionPublication[]>;
  upsertPublication(
    publication: Omit<CollectionPublication, 'assortmentCollectionPublicationId'> & { assortmentCollectionPublicationId?: string },
  ): Promise<CollectionPublication>;
  deletePublication(assortmentCollectionPublicationId: string): Promise<boolean>;
  /**
   * Resolve which collections are visible in a store/channel scope and
   * their merchandising order. Collections without publication rows are
   * globally visible; scoped collections are visible only where a row
   * matches (NULL dimensions act as wildcards).
   */
  resolveVisibleCollections(scope: CollectionScope): Promise<ScopedCollectionPlacement[]>;
}

export interface CollectionMapRepository {
  findByCollection(assortmentCollectionId: string): Promise<CollectionMap[]>;
  findByProduct(assortmentCollectionId: string, productId: string): Promise<CollectionMap | null>;
  create(map: CollectionMap): Promise<CollectionMap>;
  delete(assortmentCollectionMapId: string): Promise<boolean>;
  deleteByProduct(assortmentCollectionId: string, productId: string): Promise<boolean>;
  deleteByCollection(assortmentCollectionId: string): Promise<void>;
}

export interface StoreAssortmentRepository {
  findByStoreId(storeId: string): Promise<StoreAssortment | null>;
  upsert(assortment: StoreAssortment): Promise<StoreAssortment>;
  findEntriesByStoreId(storeId: string): Promise<StoreAssortmentEntry[]>;
  createEntry(entry: StoreAssortmentEntry): Promise<StoreAssortmentEntry>;
  deleteEntry(assortmentStoreEntryId: string): Promise<boolean>;
  deleteEntriesByStore(storeId: string): Promise<void>;
}
