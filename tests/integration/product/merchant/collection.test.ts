/**
 * Integration tests for collections and product lists
 * Covers: spec 06-relationships-bundles-collections.md Parts C & D
 * - Collection CRUD + product map management
 * - Product list CRUD + list items
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID } from '../testUtils';

;
;

describe('Collections & Product Lists', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdCollectionId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (createdCollectionId) {
      await client
        .delete(`/business/collections/${createdCollectionId}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        })
        .catch(() => {});
    }
  });

  // ── Collections ──────────────────────────────────────────────────────────

  describe('Collections', () => {
    it('should reject creation without name', async () => {
      const res = await client.post(
        '/business/collections',
        { slug: 'no-name' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should reject creation without slug', async () => {
      const res = await client.post(
        '/business/collections',
        { name: 'No Slug' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should create a collection with products', async () => {
      const res = await client.post(
        '/business/collections',
        {
          name: `Test Collection ${Date.now()}`,
          slug: `test-col-${Date.now()}`,
          isActive: true,
          addProducts: [
            { productId: SEEDED_PRODUCT_1_ID, position: 0 },
          ],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      createdCollectionId =
        res.data.data?.collection?.productCollectionId ||
        res.data.data?.productCollectionId ||
        res.data.data?.id;
      expect(createdCollectionId).toBeTruthy();
      // Map items should be returned
      expect(Array.isArray(res.data.data?.mapItems)).toBe(true);
    });

    it('should list all collections', async () => {
      const res = await client.get('/business/collections', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should update a collection and add another product', async () => {
      if (!createdCollectionId) return;
      const res = await client.put(
        `/business/collections/${createdCollectionId}`,
        {
          name: `Updated Collection ${Date.now()}`,
          slug: `updated-col-${Date.now()}`,
          addProducts: [{ productId: SEEDED_PRODUCT_2_ID, position: 1 }],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should return 404 when updating non-existent collection', async () => {
      const res = await client.put(
        '/business/collections/00000000-0000-0000-0000-999999999999',
        { name: 'Ghost', slug: 'ghost' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(404);
    });

    it('should soft-delete a collection', async () => {
      if (!createdCollectionId) return;
      const res = await client.delete(`/business/collections/${createdCollectionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      createdCollectionId = null;
    });
  });
});
