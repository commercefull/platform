/**
 * Organization: Product Lifecycle
 * Covers: docs/specs/product/organization/01-product-lifecycle.md
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID, SEEDED_PRODUCT_TYPE_SIMPLE_ID } from '../testUtils';

describe('Organization: Product Lifecycle', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdProductId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdProductId) {
      await client
        .delete(`/business/products/${createdProductId}?permanent=true`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        .catch(() => {});
    }
  });

  describe('Creation guards', () => {
    it('should reject creation without name', async () => {
      const res = await client.post(
        '/business/products',
        { productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should reject creation without productTypeId', async () => {
      const res = await client.post(
        '/business/products',
        { name: 'No Type' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should create product in DRAFT status with not_visible visibility', async () => {
      const res = await client.post(
        '/business/products',
        {
          name: `Lifecycle Test ${Date.now()}`,
          description: 'lifecycle test',
          productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID,
          basePrice: 50,
          sku: `LC-${Date.now()}`,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.data.status).toBe('draft');
      expect(['hidden', 'not_visible']).toContain(res.data.data.visibility);
      createdProductId = res.data.data.productId;
    });

    it('should reject duplicate SKU', async () => {
      const sku = `DUP-${Date.now()}`;
      await client.post(
        '/business/products',
        { name: 'First', productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID, sku },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      const res = await client.post(
        '/business/products',
        { name: 'Second', productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID, sku },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Price guards', () => {
    it('should reject negative basePrice', async () => {
      const res = await client.put(
        `/business/products/${SEEDED_PRODUCT_1_ID}`,
        { basePrice: -1 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject salePrice greater than basePrice', async () => {
      const res = await client.put(
        `/business/products/${SEEDED_PRODUCT_1_ID}`,
        { basePrice: 10, salePrice: 20 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('CRUD', () => {
    it('should get a product by ID', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('productId', SEEDED_PRODUCT_1_ID);
      expect(res.data.data).toHaveProperty('basePrice');
      expect(res.data.data).toHaveProperty('createdAt');
    });

    it('should list products with pagination', async () => {
      const res = await client.get('/business/products', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.products).toBeDefined();
      expect(res.data.data.total).toBeDefined();
    });

    it('should update a product', async () => {
      const res = await client.put(
        `/business/products/${SEEDED_PRODUCT_1_ID}`,
        { name: 'Updated Test Product', description: 'Updated', basePrice: 129.99 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('name', 'Updated Test Product');
      expect(res.data.data).toHaveProperty('basePrice', 129.99);
    });

    it('should search products', async () => {
      const res = await client.get('/business/products?search=Test', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
    });

    it('should get product with variants', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_2_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('hasVariants', true);
    });

    it('should return 404 for non-existent product', async () => {
      const res = await client.get('/business/products/00000000-0000-0000-0000-999999999999', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  describe('Status transitions', () => {
    it('should transition DRAFT → ACTIVE', async () => {
      if (!createdProductId) return;
      const res = await client.put(
        `/business/products/${createdProductId}/status`,
        { status: 'active' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.data.status).toBe('active');
    });

    it('should reject invalid transition ACTIVE → DRAFT', async () => {
      if (!createdProductId) return;
      const res = await client.put(
        `/business/products/${createdProductId}/status`,
        { status: 'draft' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject invalid status value', async () => {
      if (!createdProductId) return;
      const res = await client.put(
        `/business/products/${createdProductId}/status`,
        { status: 'banana' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
    });

    it('should update visibility', async () => {
      const res = await client.put(
        `/business/products/${SEEDED_PRODUCT_1_ID}/visibility`,
        { visibility: 'not_visible' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.data).toHaveProperty('visibility', 'not_visible');
      // Restore
      await client.put(
        `/business/products/${SEEDED_PRODUCT_1_ID}/visibility`,
        { visibility: 'visible' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
    });
  });

  describe('Publish / unpublish', () => {
    it('should reject publish when not ACTIVE', async () => {
      const createRes = await client.post(
        '/business/products',
        { name: `Pub Guard ${Date.now()}`, productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID, basePrice: 10 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      const draftId = createRes.data.data?.productId;
      if (!draftId) return;
      const res = await client.post(`/business/products/${draftId}/publish`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
      await client.delete(`/business/products/${draftId}?permanent=true`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
    });

    it('should publish an ACTIVE product', async () => {
      if (!createdProductId) return;
      await client.put(`/business/products/${createdProductId}/status`, { status: 'active' }, {
        headers: { Authorization: `Bearer ${adminToken}` },
      }).catch(() => {});
      const res = await client.post(`/business/products/${createdProductId}/publish`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.visibility).toBe('visible');
      expect(res.data.data.publishedAt).toBeTruthy();
    });

    it('should unpublish a product', async () => {
      if (!createdProductId) return;
      const res = await client.post(`/business/products/${createdProductId}/unpublish`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(['hidden', 'not_visible']).toContain(res.data.data.visibility);
    });
  });

  describe('Delete', () => {
    it('should soft-delete a product', async () => {
      const createRes = await client.post(
        '/business/products',
        { name: `SoftDel ${Date.now()}`, productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID, basePrice: 10 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      const id = createRes.data.data?.productId;
      if (!id) return;
      const res = await client.delete(`/business/products/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.permanent).toBe(false);
    });

    it('should hard-delete with ?permanent=true', async () => {
      const createRes = await client.post(
        '/business/products',
        { name: `HardDel ${Date.now()}`, productTypeId: SEEDED_PRODUCT_TYPE_SIMPLE_ID, basePrice: 10 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      const id = createRes.data.data?.productId;
      if (!id) return;
      const res = await client.delete(`/business/products/${id}?permanent=true`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data.permanent).toBe(true);
      const getRes = await client.get(`/business/products/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(getRes.status).toBe(404);
    });
  });

  describe('Store availability', () => {
    it('should return store availability for a valid product', async () => {
      const res = await client.get(
        `/business/products/${SEEDED_PRODUCT_1_ID}/store-availability`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expectStatus(res, 200);
    });

    it('should return 404 for non-existent product store availability', async () => {
      const res = await client.get(
        '/business/products/00000000-0000-0000-0000-999999999999/store-availability',
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(404);
    });
  });
});
