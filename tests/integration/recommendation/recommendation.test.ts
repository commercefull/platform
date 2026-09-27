/**
 * Recommendation API Integration Tests
 *
 * Covers:
 * - Customer: placement serving, popular list, headless POST, placement validation
 * - Business: rules CRUD, exclusions CRUD, stats, rebuild, suggestions, preview
 * - End-to-end: manual product link → served in pdpAlsoLike placement
 * - Product relationship delete route at /business/products/relationships/:id
 * - Auth guards on all /business/recommendation routes
 *
 * Uses seeded products (00000000-...-001/2/3) from seedProductTestData.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID, SEEDED_PRODUCT_3_ID } from '../product/testUtils';

describe('Recommendation API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Recommendation tests');
  });

  // ── End-to-end: manual link served on the storefront placement ─────────────
  // Runs first: the serving layer caches per (org, placement, products, limit),
  // so p1's pdpAlsoLike must not be fetched before the link exists.

  describe('Manual link → served recommendation', () => {
    let relationshipId: string;

    it('should create a manual related link via the product relationships API', async () => {
      const res = await client.post(
        `/business/products/${SEEDED_PRODUCT_1_ID}/relationships`,
        { relatedProductId: SEEDED_PRODUCT_2_ID, type: 'related', position: 1 },
        { headers: headers() },
      );
      expectStatus(res, 201);
      relationshipId = res.data.data.productRelatedId;
      expect(relationshipId).toBeTruthy();
    });

    it('should serve the linked product in the customer pdpAlsoLike placement', async () => {
      const res = await client.get(`/customer/recommendation/products/${SEEDED_PRODUCT_1_ID}?placement=pdpAlsoLike`);
      expectStatus(res, 200);
      expect(res.data.success).toBe(true);
      const items = res.data.data.items;
      expect(Array.isArray(items)).toBe(true);
      const found = items.find((i: { productId: string }) => i.productId === SEEDED_PRODUCT_2_ID);
      expect(found).toBeTruthy();
      expect(found.source).toBe('manual');
    });

    it('should delete the link via /business/products/relationships/:id', async () => {
      const res = await client.delete(`/business/products/relationships/${relationshipId}`, { headers: headers() });
      expectStatus(res, 200);
      expect(res.data.success).toBe(true);
    });
  });

  // ── Customer endpoints ─────────────────────────────────────────────────────

  describe('Customer: placement serving', () => {
    it('GET /customer/recommendation/products/:id returns a placement response', async () => {
      const res = await client.get(`/customer/recommendation/products/${SEEDED_PRODUCT_3_ID}?placement=pdpBoughtWith`);
      expectStatus(res, 200);
      expect(res.data.data.placement).toBe('pdpBoughtWith');
      expect(Array.isArray(res.data.data.items)).toBe(true);
    });

    it('GET /customer/recommendation/products/:id rejects an unknown placement', async () => {
      const res = await client.get(`/customer/recommendation/products/${SEEDED_PRODUCT_3_ID}?placement=bogus`);
      expectStatus(res, 400);
      expect(res.data.success).toBe(false);
    });

    it('POST /customer/recommendation/products serves headless multi-product placements', async () => {
      const res = await client.post('/customer/recommendation/products', {
        productIds: [SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_3_ID],
        placement: 'cartAddOns',
      });
      expectStatus(res, 200);
      expect(res.data.data.placement).toBe('cartAddOns');
      expect(Array.isArray(res.data.data.items)).toBe(true);
    });

    it('POST /customer/recommendation/products rejects an empty productIds array', async () => {
      const res = await client.post('/customer/recommendation/products', { productIds: [] });
      expectStatus(res, 400);
    });

    it('GET /customer/recommendation/popular returns the emptyState list', async () => {
      const res = await client.get('/customer/recommendation/popular');
      expectStatus(res, 200);
      expect(res.data.data.placement).toBe('emptyState');
      expect(Array.isArray(res.data.data.items)).toBe(true);
    });
  });

  // ── Business: rules ────────────────────────────────────────────────────────

  describe('Business: rules CRUD', () => {
    let ruleId: string;

    it('POST /business/recommendation/rules creates a rule', async () => {
      const res = await client.post(
        '/business/recommendation/rules',
        {
          name: 'Cameras → Memory Cards',
          sourceType: 'category',
          sourceId: 'e0000000-0000-0000-0000-000000000001',
          targetType: 'category',
          targetId: 'e0000000-0000-0000-0000-000000000002',
          relationType: 'accessory',
          maxItems: 4,
        },
        { headers: headers() },
      );
      expectStatus(res, 201);
      ruleId = res.data.data.recommendationRuleId;
      expect(ruleId).toBeTruthy();
    });

    it('POST /business/recommendation/rules rejects missing fields', async () => {
      const res = await client.post('/business/recommendation/rules', { name: 'x' }, { headers: headers() });
      expectStatus(res, 400);
    });

    it('GET /business/recommendation/rules lists the created rule', async () => {
      const res = await client.get('/business/recommendation/rules', { headers: headers() });
      expectStatus(res, 200);
      const rules = res.data.data.rules;
      expect(rules.some((r: { recommendationRuleId: string }) => r.recommendationRuleId === ruleId)).toBe(true);
    });

    it('PUT /business/recommendation/rules/:id updates the rule', async () => {
      const res = await client.put(
        `/business/recommendation/rules/${ruleId}`,
        { name: 'Renamed Rule', priority: 10 },
        { headers: headers() },
      );
      expectStatus(res, 200);
      expect(res.data.data.name).toBe('Renamed Rule');
      expect(res.data.data.priority).toBe(10);
    });

    it('DELETE /business/recommendation/rules/:id deletes the rule', async () => {
      const res = await client.delete(`/business/recommendation/rules/${ruleId}`, { headers: headers() });
      expectStatus(res, 200);

      const list = await client.get('/business/recommendation/rules', { headers: headers() });
      expect(list.data.data.rules.some((r: { recommendationRuleId: string }) => r.recommendationRuleId === ruleId)).toBe(false);
    });

    it('DELETE /business/recommendation/rules/:id returns 404 for unknown rules', async () => {
      const res = await client.delete('/business/recommendation/rules/00000000-0000-0000-0000-000000000099', {
        headers: headers(),
      });
      expectStatus(res, 404);
    });
  });

  // ── Business: exclusions ───────────────────────────────────────────────────

  describe('Business: exclusions CRUD', () => {
    let pairExclusionId: string;
    let globalExclusionId: string;

    it('POST /business/recommendation/exclusions creates a pair exclusion', async () => {
      const res = await client.post(
        '/business/recommendation/exclusions',
        { productId: SEEDED_PRODUCT_1_ID, excludedProductId: SEEDED_PRODUCT_3_ID },
        { headers: headers() },
      );
      expectStatus(res, 201);
      pairExclusionId = res.data.data.recommendationExclusionId;
      expect(res.data.data.scope).toBe('pair');
    });

    it('POST /business/recommendation/exclusions creates a global exclusion', async () => {
      const res = await client.post(
        '/business/recommendation/exclusions',
        { excludedProductId: SEEDED_PRODUCT_3_ID, scope: 'global', reason: 'discontinued' },
        { headers: headers() },
      );
      expectStatus(res, 201);
      globalExclusionId = res.data.data.recommendationExclusionId;
      expect(res.data.data.scope).toBe('global');
    });

    it('POST /business/recommendation/exclusions requires productId for pair scope', async () => {
      const res = await client.post(
        '/business/recommendation/exclusions',
        { excludedProductId: SEEDED_PRODUCT_3_ID },
        { headers: headers() },
      );
      expectStatus(res, 400);
    });

    it('GET /business/recommendation/exclusions lists both exclusions', async () => {
      const res = await client.get('/business/recommendation/exclusions', { headers: headers() });
      expectStatus(res, 200);
      const ids = res.data.data.exclusions.map((e: { recommendationExclusionId: string }) => e.recommendationExclusionId);
      expect(ids).toEqual(expect.arrayContaining([pairExclusionId, globalExclusionId]));
    });

    it('DELETE /business/recommendation/exclusions/:id removes exclusions', async () => {
      const res = await client.delete(`/business/recommendation/exclusions/${pairExclusionId}`, { headers: headers() });
      expectStatus(res, 200);
      const res2 = await client.delete(`/business/recommendation/exclusions/${globalExclusionId}`, { headers: headers() });
      expectStatus(res2, 200);
    });
  });

  // ── Business: suggestions, preview, stats, rebuild ─────────────────────────

  describe('Business: suggestions, preview, stats, rebuild', () => {
    it('GET /business/recommendation/products/:id/suggestions returns a list', async () => {
      const res = await client.get(`/business/recommendation/products/${SEEDED_PRODUCT_1_ID}/suggestions`, {
        headers: headers(),
      });
      expectStatus(res, 200);
      expect(Array.isArray(res.data.data.suggestions)).toBe(true);
    });

    it('POST /business/recommendation/products/:id/suggestions/accept validates input', async () => {
      const res = await client.post(
        `/business/recommendation/products/${SEEDED_PRODUCT_1_ID}/suggestions/accept`,
        {},
        { headers: headers() },
      );
      expectStatus(res, 400);
    });

    it('GET /business/recommendation/products/:id/preview returns a placement preview', async () => {
      const res = await client.get(`/business/recommendation/products/${SEEDED_PRODUCT_1_ID}/preview?placement=pdpBoughtWith`, {
        headers: headers(),
      });
      expectStatus(res, 200);
      expect(res.data.data.placement).toBe('pdpBoughtWith');
      expect(Array.isArray(res.data.data.items)).toBe(true);
    });

    it('POST /business/recommendation/rebuild runs the rebuild', async () => {
      const res = await client.post('/business/recommendation/rebuild', {}, { headers: headers() });
      expectStatus(res, 200);
      expect(res.data.data).toHaveProperty('candidatesWritten');
    });

    it('GET /business/recommendation/stats returns stats after rebuild', async () => {
      const res = await client.get('/business/recommendation/stats', { headers: headers() });
      expectStatus(res, 200);
      expect(res.data.data).toHaveProperty('productsWithFbt');
      expect(res.data.data).toHaveProperty('lastRebuiltAt');
      expect(res.data.data).toHaveProperty('ordersCounted');
    });
  });

  // ── Auth guards ────────────────────────────────────────────────────────────

  describe('Auth guards', () => {
    it('rejects unauthenticated access to business recommendation routes', async () => {
      const res = await client.get('/business/recommendation/rules');
      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated rebuild', async () => {
      const res = await client.post('/business/recommendation/rebuild', {});
      expect(res.status).toBe(401);
    });
  });
});
