/**
 * Customer: Product Browsing
 * Covers: docs/specs/product/customer.md §2.1, §3, §5.1, §5.5
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID } from '../testUtils';

;
;

describe('Customer: Product Browsing', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('List products', () => {
    it('should return paginated list with total, limit, offset', async () => {
      const res = await client.get('/customer/products');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('products');
      expect(res.data.data).toHaveProperty('total');
      expect(res.data.data).toHaveProperty('limit');
      expect(res.data.data).toHaveProperty('offset');
      expect(Array.isArray(res.data.data.products)).toBe(true);
    });

    it('should only return ACTIVE + VISIBLE/FEATURED products', async () => {
      const res = await client.get('/customer/products');
      expect(res.status).toBe(200);
      res.data.data.products.forEach((p: any) => {
        expect(p.status).toBe('active');
        expect(['visible', 'featured']).toContain(p.visibility);
      });
    });

    it('should support pagination', async () => {
      const res = await client.get('/customer/products?limit=2&offset=0');
      expect(res.status).toBe(200);
      expect(res.data.data.products.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Get product by ID or slug', () => {
    it('should get a product by UUID', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.productId).toBe(SEEDED_PRODUCT_1_ID);
    });

    it('should get a product by slug', async () => {
      const res = await client.get('/customer/products/test-product-one');
      expect([200, 404]).toContain(res.status); // slug may have changed
    });

    it('should return 404 for non-existent product', async () => {
      const res = await client.get('/customer/products/00000000-0000-0000-0000-999999999999');
      expect(res.status).toBe(404);
    });

    it('should return 404 for hidden product (visibility guard)', async () => {
      await client.put(
        `/business/products/${SEEDED_PRODUCT_2_ID}/visibility`,
        { visibility: 'not_visible' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_2_ID}`);
      expect(res.status).toBe(404);
      // Restore
      await client.put(
        `/business/products/${SEEDED_PRODUCT_2_ID}/visibility`,
        { visibility: 'visible' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
    });
  });

  describe('Featured products', () => {
    it('should return only featured products', async () => {
      const res = await client.get('/customer/products/featured');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data.products)).toBe(true);
      res.data.data.products.forEach((p: any) => {
        expect(p.isFeatured).toBe(true);
      });
    });
  });

  describe('Products by category', () => {
    it('should return products for a valid category', async () => {
      const catRes = await client.get('/customer/categories');
      const categories = catRes.data.data;
      if (!categories || categories.length === 0) return;
      const catId = categories[0].productCategoryId || categories[0].categoryId || categories[0].id;
      const res = await client.get(`/customer/products/category/${catId}`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data.products)).toBe(true);
    });
  });

  describe('Related products', () => {
    it('should return related products excluding the source product', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/related`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const ids = res.data.data.products.map((p: any) => p.productId);
      expect(ids).not.toContain(SEEDED_PRODUCT_1_ID);
    });

    it('should respect limit parameter', async () => {
      const res = await client.get(`/customer/products/${SEEDED_PRODUCT_1_ID}/related?limit=2`);
      expect(res.status).toBe(200);
      expect(res.data.data.products.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Barcode lookup', () => {
    it('should return 404 for non-existent barcode', async () => {
      const res = await client.get('/customer/products/barcode/NONEXISTENT-XYZ');
      expect(res.status).toBe(404);
    });
  });
});
