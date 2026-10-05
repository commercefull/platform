/**
 * Shared test utilities for assortment unit tests.
 *
 * Import this file FIRST in each test file: it registers the boundary mocks
 * (event bus, uuid) before the use cases under test are evaluated.
 * Tests use real domain objects — only the ports are mocked.
 */

import { Collection } from '../domain/entities/Collection';
import { CollectionMap } from '../domain/entities/CollectionMap';
import { StoreAssortment } from '../domain/entities/StoreAssortment';
import { StoreAssortmentEntry } from '../domain/entities/StoreAssortmentEntry';
import { eventBus } from '../../../libs/events/eventBus';
import type { CollectionRepository, CollectionMapRepository, StoreAssortmentRepository } from '../domain/repositories/AssortmentRepository';
import type { CatalogQueryPort, CatalogProductRef } from '../application/ports/CatalogQueryPort';
import type { StoreLookupPort } from '../application/ports/StoreLookupPort';

jest.mock('../../../libs/events/eventBus', () => ({
  __esModule: true,
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'test-uuid'),
}));

export const emitMock = jest.mocked(eventBus.emit);

beforeEach(() => {
  emitMock.mockClear();
});

export const COLLECTION_ID = '11111111-1111-1111-1111-111111111111';
const MAP_ID = '22222222-2222-2222-2222-222222222222';
export const STORE_ID = '33333333-3333-3333-3333-333333333333';
const ENTRY_ID = '44444444-4444-4444-4444-444444444444';
export const PRODUCT_ID = '55555555-5555-5555-5555-555555555555';

export function createCollection(overrides: Partial<Parameters<typeof Collection.create>[0]> = {}): Collection {
  return Collection.create({
    assortmentCollectionId: COLLECTION_ID,
    name: 'Test Collection',
    slug: 'test-collection',
    ...overrides,
  });
}

export function createMap(overrides: Partial<Parameters<typeof CollectionMap.create>[0]> = {}): CollectionMap {
  return CollectionMap.create({
    assortmentCollectionMapId: MAP_ID,
    assortmentCollectionId: COLLECTION_ID,
    productId: PRODUCT_ID,
    ...overrides,
  });
}

export function createStoreAssortment(storeId = STORE_ID, mode: 'all' | 'include' | 'exclude' = 'all'): StoreAssortment {
  return StoreAssortment.create(storeId, mode);
}

export function createEntry(overrides: Partial<Parameters<typeof StoreAssortmentEntry.create>[0]> = {}): StoreAssortmentEntry {
  return StoreAssortmentEntry.create({
    assortmentStoreEntryId: ENTRY_ID,
    storeId: STORE_ID,
    targetType: 'product',
    targetId: PRODUCT_ID,
    effect: 'include',
    ...overrides,
  });
}

export function productRef(productId: string, overrides: Partial<CatalogProductRef> = {}): CatalogProductRef {
  return {
    productId,
    name: `Product ${productId}`,
    slug: `product-${productId}`,
    effectivePriceCents: 1000,
    isFeatured: false,
    ...overrides,
  };
}

export function createCollectionRepository(collection: Collection | null = null): jest.Mocked<CollectionRepository> {
  return {
    findAll: jest.fn().mockResolvedValue(collection ? [collection] : []),
    findById: jest.fn().mockResolvedValue(collection),
    findBySlug: jest.fn().mockResolvedValue(collection),
    create: jest.fn().mockImplementation(c => Promise.resolve(c)),
    update: jest.fn().mockImplementation(c => Promise.resolve(c)),
    delete: jest.fn().mockResolvedValue(true),
    hardDelete: jest.fn().mockResolvedValue(true),
    listPublications: jest.fn().mockResolvedValue([]),
    upsertPublication: jest.fn().mockImplementation(p => Promise.resolve({ assortmentCollectionPublicationId: 'pub-1', ...p })),
    deletePublication: jest.fn().mockResolvedValue(true),
    resolveVisibleCollections: jest
      .fn()
      .mockResolvedValue(collection ? [{ assortmentCollectionId: collection.assortmentCollectionId }] : []),
  };
}

export function createCollectionMapRepository(maps: CollectionMap[] = []): jest.Mocked<CollectionMapRepository> {
  return {
    findByCollection: jest.fn().mockResolvedValue(maps),
    findByProduct: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockImplementation(m => Promise.resolve(m)),
    delete: jest.fn().mockResolvedValue(true),
    deleteByProduct: jest.fn().mockResolvedValue(true),
    deleteByCollection: jest.fn().mockResolvedValue(undefined),
  };
}

export function createStoreAssortmentRepository(
  assortment: StoreAssortment | null = null,
  entries: StoreAssortmentEntry[] = [],
): jest.Mocked<StoreAssortmentRepository> {
  return {
    findByStoreId: jest.fn().mockResolvedValue(assortment),
    upsert: jest.fn().mockImplementation(a => Promise.resolve(a)),
    findEntriesByStoreId: jest.fn().mockResolvedValue(entries),
    createEntry: jest.fn().mockImplementation(e => Promise.resolve(e)),
    deleteEntry: jest.fn().mockResolvedValue(true),
    deleteEntriesByStore: jest.fn().mockResolvedValue(undefined),
  };
}

export function createCatalogPort(products: CatalogProductRef[] = []): jest.Mocked<CatalogQueryPort> {
  return {
    searchProducts: jest.fn().mockResolvedValue({ products, total: products.length }),
    findProductsByIds: jest.fn().mockImplementation((ids: string[]) => Promise.resolve(products.filter(p => ids.includes(p.productId)))),
  };
}

export function createStoreLookupPort(exists = true): jest.Mocked<StoreLookupPort> {
  return {
    storeExists: jest.fn().mockResolvedValue(exists),
  };
}
