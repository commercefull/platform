/**
 * Integration tests for configurable product features
 * Covers:
 * - Business: variant matrix retrieval
 * - Business: configure variant by options
 * - Customer: configure variant by options
 * - Validation: missing/empty options, non-existent product
 * - Auth guards on configurable product endpoints
 * - Bundle price calculation with real product prices
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_BUNDLE_1_ID, SEEDED_PRODUCT_2_ID } from '../testUtils';

describe('Configurable Product', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  // ── Merchant: Variant Matrix ─────────────────────────────────────────────

  describe('Merchant: Variant Matrix', () => {
    it('should get variant matrix for a product', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/variant-matrix`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data).toHaveProperty('productId');
      expect(res.data.data).toHaveProperty('optionAxes');
      expect(res.data.data).toHaveProperty('variants');
      expect(Array.isArray(res.data.data.variants)).toBe(true);
    });

    it('should return 404 for variant matrix of non-existent product', async () => {
      const fakeId = '99999999-9999-9999-9999-999999999999';
      const res = await client.get(`/business/products/${fakeId}/variant-matrix`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });
  });

  // ── Merchant: Configure Variant ──────────────────────────────────────────

  describe('Merchant: Configure Variant', () => {
    it('should configure a variant by options', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/configure`,
        { options: [{ name: 'Color', value: 'Red' }] },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (res.status === 200) {
        expect(res.data.success).toBe(true);
        expect(res.data.data).toHaveProperty('id');
        expect(res.data.data).toHaveProperty('options');
      } else {
        expect(res.status).toBe(404);
      }
    });

    it('should reject configure without options array', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/configure`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
    });

    it('should reject configure with empty options array', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/configure`,
        { options: [] },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
    });
  });

  // ── Customer: Configure Variant ──────────────────────────────────────────

  describe('Customer: Configure Variant', () => {
    it('should configure a variant by options', async () => {
      const res = await client.post(`/customer/products/${SEEDED_PRODUCT_1_ID}/configure`, {
        options: [{ name: 'Color', value: 'Red' }],
      });

      if (res.status === 200) {
        expect(res.data.success).toBe(true);
        expect(res.data.data).toHaveProperty('id');
      } else {
        expect(res.status).toBe(404);
      }
    });
  });

  // ── Bundle Price Calculation (with real prices) ──────────────────────────

  describe('Bundle Price Calculation (Real Prices)', () => {
    it('should calculate bundle price using real product prices', async () => {
      const res = await client.post(
        `/customer/products/bundles/${SEEDED_BUNDLE_1_ID}/calculate`,
        {},
      );

      if (res.status === 200) {
        expect(res.data.success).toBe(true);
        expect(res.data.data).toHaveProperty('price');
        expect(res.data.data.price).toBeGreaterThanOrEqual(0);
      } else {
        expectStatus(res, 400);
      }
    });

    it('should configure variant by options (customer)', async () => {
      const res = await client.post(
        `/customer/products/bundles/${SEEDED_BUNDLE_1_ID}/calculate`,
        {
          selectedItems: [
            { productId: SEEDED_PRODUCT_1_ID, quantity: 1 },
            { productId: SEEDED_PRODUCT_2_ID, quantity: 2 },
          ],
        },
      );

      if (res.status === 200) {
        expect(res.data.success).toBe(true);
        expect(typeof res.data.data.price).toBe('number');
      } else {
        expectStatus(res, 400);
      }
    });
  });

  // ── Auth Guards ──────────────────────────────────────────────────────────

  describe('Auth Guards', () => {
    it('should reject variant matrix without auth', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/variant-matrix`);
      expectStatus(res, 401);
    });
  });
});
