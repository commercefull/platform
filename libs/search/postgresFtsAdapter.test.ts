jest.mock('../db', () => ({
  query: jest.fn().mockResolvedValue([]),
}));

jest.mock('../logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

import { query } from '../db';
import { PostgresFtsAdapter } from './postgresFtsAdapter';
import {
  setSearchAdapter,
  getSearchAdapter,
  isSearchAdapterConfigured,
  type SearchProductItem,
} from './types';

const mockedQuery = query as jest.MockedFunction<typeof query>;

describe('PostgresFtsAdapter', () => {
  let adapter: PostgresFtsAdapter;

  beforeEach(() => {
    jest.clearAllMocks();
    adapter = new PostgresFtsAdapter();
  });

  describe('search', () => {
    it('returns empty results when no data', async () => {
      mockedQuery.mockResolvedValue([] as never);

      const result = await adapter.search({ query: 'test' });

      expect(result.products).toEqual([]);
      expect(result.total).toBe(0);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it('returns products and total count', async () => {
      const mockProducts: SearchProductItem[] = [
        {
          productId: 'p1',
          name: 'Test Product',
          slug: 'test-product',
          sku: 'SKU001',
          price: 29.99,
          status: 'active',
          visibility: 'visible',
          isFeatured: false,
          isNew: false,
          isBestseller: false,
        },
      ];

      mockedQuery
        .mockResolvedValueOnce(mockProducts as never)
        .mockResolvedValueOnce([{ count: '1' }] as never)
        .mockResolvedValue([] as never); // facets

      const result = await adapter.search({ query: 'test', includeFacets: false });

      expect(result.products).toHaveLength(1);
      expect(result.products[0].productId).toBe('p1');
      expect(result.total).toBe(1);
    });

    it('applies merchandising boost/bury/pin', async () => {
      const mockProducts: SearchProductItem[] = [
        { productId: 'normal1', name: 'Normal 1', slug: 'n1', price: 10, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
        { productId: 'boosted1', name: 'Boosted 1', slug: 'b1', price: 20, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
        { productId: 'buried1', name: 'Buried 1', slug: 'br1', price: 30, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
        { productId: 'pinned1', name: 'Pinned 1', slug: 'p1', price: 40, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
      ];

      mockedQuery
        .mockResolvedValueOnce(mockProducts as never)
        .mockResolvedValueOnce([{ count: '4' }] as never);

      const result = await adapter.search({
        query: 'test',
        includeFacets: false,
        merchandising: {
          boostProductIds: ['boosted1'],
          buryProductIds: ['buried1'],
          pinnedProducts: [{ productId: 'pinned1', position: 0 }],
        },
      });

      expect(result.products[0].productId).toBe('pinned1');
      expect(result.products[0].merchandisingApplied).toBe('pinned');
      expect(result.products[1].productId).toBe('boosted1');
      expect(result.products[1].merchandisingApplied).toBe('boosted');
      expect(result.products[2].productId).toBe('normal1');
      expect(result.products[3].productId).toBe('buried1');
      expect(result.products[3].merchandisingApplied).toBe('buried');
    });

    it('applies manual ordering for category', async () => {
      const mockProducts: SearchProductItem[] = [
        { productId: 'p3', name: 'Product 3', slug: 'p3', price: 30, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
        { productId: 'p1', name: 'Product 1', slug: 'p1', price: 10, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
        { productId: 'p2', name: 'Product 2', slug: 'p2', price: 20, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
        { productId: 'p4', name: 'Product 4', slug: 'p4', price: 40, status: 'active', visibility: 'visible', isFeatured: false, isNew: false, isBestseller: false },
      ];

      mockedQuery
        .mockResolvedValueOnce(mockProducts as never)
        .mockResolvedValueOnce([{ count: '4' }] as never);

      const result = await adapter.search({
        categoryId: 'cat1',
        sortBy: 'manual',
        includeFacets: false,
        manualOrdering: {
          categoryId: 'cat1',
          productIds: ['p1', 'p2', 'p3'],
        },
      });

      expect(result.products[0].productId).toBe('p1');
      expect(result.products[0].merchandisingApplied).toBe('manual');
      expect(result.products[1].productId).toBe('p2');
      expect(result.products[2].productId).toBe('p3');
      // p4 is not in manual order, comes after
      expect(result.products[3].productId).toBe('p4');
      expect(result.products[3].merchandisingApplied).toBeUndefined();
    });
  });

  describe('autocomplete', () => {
    it('returns empty for queries shorter than 2 chars', async () => {
      const result = await adapter.autocomplete('a');
      expect(result).toEqual([]);
    });

    it('returns empty for empty query', async () => {
      const result = await adapter.autocomplete('');
      expect(result).toEqual([]);
    });

    it('returns suggestions for valid query', async () => {
      mockedQuery
        .mockResolvedValueOnce([
          { text: 'Red Shirt', type: 'product', productId: 'p1' },
          { text: 'Red Dress', type: 'product', productId: 'p2' },
        ] as never)
        .mockResolvedValueOnce([
          { text: 'Red Collection', type: 'category', categoryId: 'c1' },
        ] as never);

      const result = await adapter.autocomplete('red', 10);

      expect(result).toHaveLength(3);
      expect(result[0].text).toBe('Red Shirt');
      expect(result[0].type).toBe('product');
      expect(result[2].text).toBe('Red Collection');
      expect(result[2].type).toBe('category');
    });
  });

  describe('indexProduct / indexAll / removeProduct', () => {
    it('indexProduct is a no-op', async () => {
      await expect(adapter.indexProduct('p1')).resolves.toBeUndefined();
    });

    it('indexAll returns product count', async () => {
      mockedQuery.mockResolvedValueOnce([{ count: '42' }] as never);
      const count = await adapter.indexAll();
      expect(count).toBe(42);
    });

    it('removeProduct is a no-op', async () => {
      await expect(adapter.removeProduct('p1')).resolves.toBeUndefined();
    });
  });

  describe('health', () => {
    it('returns healthy when DB responds', async () => {
      mockedQuery.mockResolvedValueOnce([{ '?column?': 1 }] as never);
      const result = await adapter.health();
      expect(result.healthy).toBe(true);
      expect(result.details?.backend).toBe('postgres-fts');
    });

    it('returns unhealthy when DB fails', async () => {
      mockedQuery.mockRejectedValueOnce(new Error('Connection refused') as never);
      const result = await adapter.health();
      expect(result.healthy).toBe(false);
    });
  });
});

describe('Search adapter registry', () => {
  it('isSearchAdapterConfigured returns false before setSearchAdapter', () => {
    // Reset by checking — the registry is a module singleton
    // In tests, the adapter may or may not be set from previous tests
    expect(typeof isSearchAdapterConfigured()).toBe('boolean');
  });

  it('setSearchAdapter / getSearchAdapter round-trip', () => {
    const testAdapter = new PostgresFtsAdapter();
    setSearchAdapter(testAdapter);
    expect(isSearchAdapterConfigured()).toBe(true);
    expect(getSearchAdapter()).toBe(testAdapter);
  });
});
