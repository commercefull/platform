/**
 * Customer: Product Search
 * Covers: docs/specs/product/customer.md §2.2, §5.2
 */

import { AxiosInstance } from 'axios';
import { createTestClient } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID } from '../testUtils';

;
;

describe('Customer: Product Search', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = createTestClient();
  });

  describe('Basic Search (GET)', () => {
    it('should search products with text query', async () => {
      const res = await client.get('/customer/products/search?q=test');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('products');
      expect(res.data.data).toHaveProperty('total');
      expect(res.data.data).toHaveProperty('page');
      expect(res.data.data).toHaveProperty('limit');
      expect(res.data.data).toHaveProperty('totalPages');
    });

    it('should support pagination', async () => {
      const res = await client.get('/customer/products/search?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(res.data.data.page).toBe(1);
      expect(res.data.data.limit).toBe(5);
      expect(res.data.data.products.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const res = await client.get('/customer/products/search?sortBy=name&sortOrder=asc');
      expect(res.status).toBe(200);
      const products = res.data.data.products;
      if (products.length >= 2) {
        for (let i = 1; i < products.length; i++) {
          expect(products[i].name.localeCompare(products[i - 1].name)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should filter by price range', async () => {
      const res = await client.get('/customer/products/search?minPrice=10&maxPrice=200');
      expect(res.status).toBe(200);
      res.data.data.products.forEach((p: any) => {
        expect(p.price).toBeGreaterThanOrEqual(10);
        expect(p.price).toBeLessThanOrEqual(200);
      });
    });

    it('should filter featured products', async () => {
      const res = await client.get('/customer/products/search?isFeatured=true');
      expect(res.status).toBe(200);
      res.data.data.products.forEach((p: any) => {
        expect(p.isFeatured).toBe(true);
      });
    });

    it('should return empty array for short suggestion query', async () => {
      const res = await client.get('/customer/products/search/suggestions?q=a');
      expect(res.status).toBe(200);
      expect(res.data.data).toEqual([]);
    });
  });

  describe('Attribute-based Search (POST)', () => {
    it('should search with attribute filter', async () => {
      const res = await client.post('/customer/products/search', {
        attributes: [{ code: 'color-test', value: 'blue', operator: 'eq' }],
        includeFacets: false,
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data.products)).toBe(true);
    });

    it('should search with multiple attribute filters', async () => {
      const res = await client.post('/customer/products/search', {
        attributes: [
          { code: 'color-test', value: 'blue', operator: 'eq' },
          { code: 'size-test', value: 'm', operator: 'eq' },
        ],
        includeFacets: false,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data.products)).toBe(true);
    });

    it('should search with combined text and attribute filters', async () => {
      const res = await client.post('/customer/products/search', {
        query: 'test',
        attributes: [{ code: 'color-test', value: 'blue', operator: 'eq' }],
        includeFacets: false,
      });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data.products)).toBe(true);
    });

    it('should return facets when includeFacets=true', async () => {
      const res = await client.post('/customer/products/search', {
        query: 'product',
        includeFacets: true,
      });
      expect(res.status).toBe(200);
      if (res.data.data.total > 0) {
        expect(res.data.data).toHaveProperty('facets');
        if (res.data.data.facets) {
          expect(res.data.data.facets).toHaveProperty('categories');
          expect(res.data.data.facets).toHaveProperty('brands');
          expect(res.data.data.facets).toHaveProperty('priceRanges');
          expect(res.data.data.facets).toHaveProperty('attributes');
        }
      }
    });
  });

  describe('Search Suggestions', () => {
    it('should return suggestions for valid query', async () => {
      const res = await client.get('/customer/products/search/suggestions?q=test');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should limit suggestions', async () => {
      const res = await client.get('/customer/products/search/suggestions?q=test&limit=3');
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Similar Products', () => {
    it('should find similar products excluding source', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/similar`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      const ids = res.data.data.map((p: any) => p.productId);
      expect(ids).not.toContain(SEEDED_PRODUCT_1_ID);
    });

    it('should respect limit parameter', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/similar?limit=2`);
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Find by Attribute', () => {
    it('should find products by attribute code and value', async () => {
      const res = await client.get('/customer/products/by-attribute/color-test/blue');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThan(0);
    });

    it('should return empty array for non-existent attribute value', async () => {
      const res = await client.get('/customer/products/by-attribute/color-test/nonexistent-color-xyz');
      expect(res.status).toBe(200);
      expect(res.data.data.length).toBe(0);
    });
  });
});
