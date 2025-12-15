import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';
import {
  SEEDED_PRODUCT_1_ID,
  SEEDED_PRODUCT_2_ID,
  SEEDED_PRODUCT_3_ID,
  SEEDED_ATTRIBUTE_COLOR_ID,
  SEEDED_ATTRIBUTE_SIZE_ID
} from './testUtils';

describe('Product Search Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Basic Search', () => {
    it('should search products with text query', async () => {
      const response = await client.get('/customer/products/search?q=test', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('products');
      expect(response.data.data).toHaveProperty('total');
      expect(response.data.data).toHaveProperty('page');
      expect(response.data.data).toHaveProperty('limit');
      expect(response.data.data).toHaveProperty('totalPages');
      expect(Array.isArray(response.data.data.products)).toBe(true);
    });

    it('should search products with pagination', async () => {
      const response = await client.get('/customer/products/search?page=1&limit=5', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.page).toBe(1);
      expect(response.data.data.limit).toBe(5);
      expect(response.data.data.products.length).toBeLessThanOrEqual(5);
    });

    it('should search products with sorting', async () => {
      const response = await client.get('/customer/products/search?sortBy=name&sortOrder=asc', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const products = response.data.data.products;
      if (products.length >= 2) {
        // Verify ascending order
        for (let i = 1; i < products.length; i++) {
          expect(products[i].name.localeCompare(products[i-1].name)).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should search products with price range filter', async () => {
      const response = await client.get('/customer/products/search?minPrice=10&maxPrice=100', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const products = response.data.data.products;
      products.forEach((product: any) => {
        expect(product.price).toBeGreaterThanOrEqual(10);
        expect(product.price).toBeLessThanOrEqual(100);
      });
    });

    it('should search featured products', async () => {
      const response = await client.get('/customer/products/search?isFeatured=true', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      const products = response.data.data.products;
      products.forEach((product: any) => {
        expect(product.isFeatured).toBe(true);
      });
    });
  });

  describe('Attribute-based Search', () => {
    it('should search products with attribute filter (POST)', async () => {
      const searchQuery = {
        attributes: [
          {
            attributeId: SEEDED_ATTRIBUTE_COLOR_ID,
            value: 'blue',
            operator: 'eq'
          }
        ]
      };

      const response = await client.post('/customer/products/search', searchQuery, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should search products with multiple attribute filters', async () => {
      const searchQuery = {
        attributes: [
          {
            attributeId: SEEDED_ATTRIBUTE_COLOR_ID,
            values: ['blue', 'red'],
            operator: 'in'
          },
          {
            attributeId: SEEDED_ATTRIBUTE_SIZE_ID,
            value: 'm',
            operator: 'eq'
          }
        ]
      };

      const response = await client.post('/customer/products/search', searchQuery, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should search with combined text and attribute filters', async () => {
      const searchQuery = {
        query: 'product',
        minPrice: 0,
        maxPrice: 1000,
        attributes: [
          {
            attributeId: SEEDED_ATTRIBUTE_COLOR_ID,
            value: 'blue',
            operator: 'eq'
          }
        ],
        sortBy: 'price',
        sortOrder: 'asc'
      };

      const response = await client.post('/customer/products/search', searchQuery, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('Search Suggestions', () => {
    it('should get search suggestions', async () => {
      const response = await client.get('/customer/products/search/suggestions?q=test', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should limit search suggestions', async () => {
      const response = await client.get('/customer/products/search/suggestions?q=test&limit=3', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.length).toBeLessThanOrEqual(3);
    });

    it('should return empty array for short queries', async () => {
      const response = await client.get('/customer/products/search/suggestions?q=a', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
    });
  });

  describe('Similar Products', () => {
    it('should find similar products', async () => {
      const response = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/similar`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Similar products should not include the original product
      const productIds = response.data.data.map((p: any) => p.productId);
      expect(productIds).not.toContain(SEEDED_PRODUCT_1_ID);
    });

    it('should limit similar products', async () => {
      const response = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/similar?limit=2`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Find by Attribute', () => {
    it('should find products by attribute code and value', async () => {
      const response = await client.get('/customer/products/by-attribute/color-test/blue', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should return empty array for non-existent attribute value', async () => {
      const response = await client.get('/customer/products/by-attribute/color-test/nonexistent', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toEqual([]);
    });
  });

  describe('Faceted Search', () => {
    it('should return facets with search results', async () => {
      const searchQuery = {
        query: 'product',
        includeFacets: true
      };

      const response = await client.post('/customer/products/search', searchQuery, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Facets should be present when there are search results
      if (response.data.data.total > 0) {
        expect(response.data.data).toHaveProperty('facets');
        if (response.data.data.facets) {
          expect(response.data.data.facets).toHaveProperty('categories');
          expect(response.data.data.facets).toHaveProperty('brands');
          expect(response.data.data.facets).toHaveProperty('priceRanges');
          expect(response.data.data.facets).toHaveProperty('attributes');
        }
      }
    });
  });
});
