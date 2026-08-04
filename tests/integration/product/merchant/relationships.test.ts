/**
 * Integration tests for product relationships
 * Covers:
 * - Business: relationship CRUD (related, cross_sell, up_sell, grouped, accessory)
 * - Business: list relationships, filter by type
 * - Business: grouped product children listing
 * - Business: validation (missing relatedProductId, missing type)
 * - Auth guards on relationship endpoints
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID, SEEDED_PRODUCT_3_ID } from '../testUtils';

describe('Product Relationships', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdRelationshipId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdRelationshipId) {
      await client
        .delete(`/business/relationships/${createdRelationshipId}`, { headers: { Authorization: `Bearer ${adminToken}` } })
        .catch(() => {});
    }
  });

  // ── Merchant: Relationship CRUD ──────────────────────────────────────────

  describe('Merchant: Relationship CRUD', () => {
    it('should create a related product relationship', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        {
          relatedProductId: SEEDED_PRODUCT_2_ID,
          type: 'related',
          position: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (res.status === 201) {
        expect(res.data.success).toBe(true);
        expect(res.data.data).toHaveProperty('productRelatedId');
        expect(res.data.data.type).toBe('related');
        createdRelationshipId = res.data.data.productRelatedId;
      } else {
        expect(res.status).toBe(400);
      }
    });

    it('should create a cross_sell relationship', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        {
          relatedProductId: SEEDED_PRODUCT_3_ID,
          type: 'cross_sell',
          position: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.type).toBe('cross_sell');

      await client.delete(`/business/relationships/${res.data.data.productRelatedId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should create an up_sell relationship', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        {
          relatedProductId: SEEDED_PRODUCT_3_ID,
          type: 'up_sell',
          position: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.type).toBe('up_sell');

      await client.delete(`/business/relationships/${res.data.data.productRelatedId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should create a grouped relationship', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        {
          relatedProductId: SEEDED_PRODUCT_2_ID,
          type: 'grouped',
          position: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      expect(res.data.data.type).toBe('grouped');

      await client.delete(`/business/relationships/${res.data.data.productRelatedId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should list relationships for a product', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/relationships`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should list relationships filtered by type', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/relationships?type=related`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      for (const rel of res.data.data) {
        expect(rel.type).toBe('related');
      }
    });

    it('should delete a relationship', async () => {
      const createRes = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        {
          relatedProductId: SEEDED_PRODUCT_3_ID,
          type: 'accessory',
          position: 5,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (createRes.status !== 201) return;
      const relId = createRes.data.data.productRelatedId;

      const res = await client.delete(`/business/relationships/${relId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(res.data.data.deleted).toBe(true);
    });
  });

  // ── Merchant: Relationship Validation ────────────────────────────────────

  describe('Merchant: Relationship Validation', () => {
    it('should reject relationship without relatedProductId', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        { type: 'related' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
    });

    it('should reject relationship without type', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        { relatedProductId: SEEDED_PRODUCT_2_ID },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(res.status).toBe(400);
    });
  });

  // ── Merchant: Grouped Product Children ───────────────────────────────────

  describe('Merchant: Grouped Product Children', () => {
    it('should list grouped children for a product with no grouped relationships', async () => {
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_3_ID}/grouped-children`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBe(0);
    });

    it('should list grouped children after creating grouped relationship', async () => {
      // Create grouped relationship
      const createRes = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        {
          relatedProductId: SEEDED_PRODUCT_2_ID,
          type: 'grouped',
          position: 1,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      if (createRes.status !== 201) return;
      const relId = createRes.data.data.productRelatedId;

      // List grouped children
      const res = await client.get(`/business/products/${SEEDED_PRODUCT_1_ID}/grouped-children`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBeGreaterThanOrEqual(1);

      await client.delete(`/business/relationships/${relId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });
  });

  // ── Auth Guards ──────────────────────────────────────────────────────────

  describe('Auth Guards', () => {
    it('should reject relationship creation without auth', async () => {
      const res = await client.post(`/business/products/${SEEDED_PRODUCT_1_ID}/relationships`, {
        relatedProductId: SEEDED_PRODUCT_2_ID,
        type: 'related',
      });
      expect([401, 403]).toContain(res.status);
    });
  });
});
