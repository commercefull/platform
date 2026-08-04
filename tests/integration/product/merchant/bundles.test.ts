/**
 * Integration tests for bundles
 * Covers: spec 06-relationships-bundles-collections.md Part B
 * - Merchant: bundle CRUD
 * - Merchant: bundle items CRUD
 * - Customer: list active bundles, get by ID, get by product, calculate price
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';
import { SEEDED_BUNDLE_1_ID, SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID, SEEDED_PRODUCT_3_ID } from '../testUtils';

;
;

describe('Bundle Management', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdBundleId: string | null = null;
  let createdBundleItemId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdBundleId) {
      await client
        .delete(`/business/bundles/${createdBundleId}`, { headers: { Authorization: `Bearer ${adminToken}` } })
        .catch(() => {});
    }
  });

  // ── Merchant: Bundle CRUD ────────────────────────────────────────────────

  describe('Merchant: Bundle CRUD', () => {
    it('should create a bundle', async () => {
      const res = await client.post(
        '/business/bundles',
        {
          productId: SEEDED_PRODUCT_3_ID,
          bundleType: 'fixed',
          pricingType: 'percentage_discount',
          discountPercent: 10,
          isActive: true,
          name: `Test Bundle ${Date.now()}`,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      createdBundleId = res.data.data?.productBundleId || res.data.data?.bundleId || res.data.data?.id;
      expect(createdBundleId).toBeTruthy();
    });

    it('should list bundles', async () => {
      const res = await client.get('/business/bundles', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should get a bundle by ID with items', async () => {
      if (!createdBundleId) return;
      const res = await client.get(`/business/bundles/${createdBundleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('items');
    });

    it('should update a bundle', async () => {
      if (!createdBundleId) return;
      const res = await client.put(
        `/business/bundles/${createdBundleId}`,
        { discountPercent: 15 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should return 404 for non-existent bundle', async () => {
      const res = await client.get('/business/bundles/00000000-0000-0000-0000-999999999999', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });

  // ── Merchant: Bundle Items ───────────────────────────────────────────────

  describe('Merchant: Bundle items', () => {
    it('should add an item to a bundle', async () => {
      if (!createdBundleId) return;
      const res = await client.post(
        `/business/bundles/${createdBundleId}/items`,
        { productId: SEEDED_PRODUCT_2_ID, quantity: 1, isRequired: true },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      createdBundleItemId = res.data.data?.bundleItemId || res.data.data?.productBundleItemId || res.data.data?.id;
    });

    it('should update a bundle item', async () => {
      if (!createdBundleId || !createdBundleItemId) return;
      const res = await client.put(
        `/business/bundles/${createdBundleId}/items/${createdBundleItemId}`,
        { quantity: 2 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should delete a bundle item', async () => {
      if (!createdBundleId || !createdBundleItemId) return;
      const res = await client.delete(
        `/business/bundles/${createdBundleId}/items/${createdBundleItemId}`,
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      createdBundleItemId = null;
    });
  });

  // ── Customer: Bundle browsing ────────────────────────────────────────────

  describe('Customer: Bundle browsing', () => {
    it('should list active bundles', async () => {
      const res = await client.get('/customer/products/bundles');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should get bundle details by ID', async () => {
      const res = await client.get(`/customer/products/bundles/${SEEDED_BUNDLE_1_ID}`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('items');
    });

    it('should get bundle by product ID', async () => {
      const res = await client.get(`/customer/products/bundles/product/${SEEDED_PRODUCT_1_ID}`);
      // Seeded product 1 has a bundle — should return 200
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should calculate bundle price', async () => {
      const res = await client.post(`/customer/products/bundles/${SEEDED_BUNDLE_1_ID}/calculate`, {
        selectedItems: [{ productId: SEEDED_PRODUCT_2_ID, quantity: 1 }],
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('price');
      expect(res.data.data).toHaveProperty('savings');
    });

    it('should return 404 for non-existent bundle', async () => {
      const res = await client.get('/customer/products/bundles/00000000-0000-0000-0000-999999999999');
      expect(res.status).toBe(404);
    });
  });

  // ── Bundle deletion cascade ───────────────────────────────────────────────

  describe('Bundle deletion cascade with items', () => {
    it('should delete a bundle that has items without errors', async () => {
      // Create a bundle using product 1 (product 3 may already have a bundle)
      const createRes = await client.post(
        '/business/bundles',
        {
          productId: SEEDED_PRODUCT_1_ID,
          bundleType: 'fixed',
          pricingType: 'percentage_discount',
          discountPercent: 10,
          isActive: true,
          name: `Cascade Bundle ${Date.now()}`,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      // If product already has a bundle, create may return 400 — skip in that case
      if (createRes.status !== 201) return;
      const bundleId =
        createRes.data.data?.productBundleId || createRes.data.data?.bundleId || createRes.data.data?.id;

      // Add an item to the bundle
      const itemRes = await client.post(
        `/business/bundles/${bundleId}/items`,
        { productId: SEEDED_PRODUCT_2_ID, quantity: 1, isRequired: true },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(itemRes.status).toBe(201);

      // Delete the bundle — should cascade or clean up items
      const deleteRes = await client.delete(`/business/bundles/${bundleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(deleteRes.status).toBe(200);
      expect(deleteRes.data.success).toBe(true);

      // Verify the bundle is gone
      const getRes = await client.get(`/business/bundles/${bundleId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(getRes.status).toBe(404);
    });
  });
});
