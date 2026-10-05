/**
 * Integration tests for assortment collections
 * - Collection CRUD + product map management via /business/assortment/collections
 * - Collections live in modules/assortment (moved from modules/product)
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';
import { SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID } from '../product/testUtils';

const BASE = '/business/assortment/collections';

describe('Assortment Collections', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdCollectionId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Collections', () => {
    it('should reject creation without name', async () => {
      const res = await client.post(BASE, { slug: 'no-name' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should reject creation without slug', async () => {
      const res = await client.post(BASE, { name: 'No Slug' }, { headers: { Authorization: `Bearer ${adminToken}` } });
      expect(res.status).toBe(400);
      expect(res.data.success).toBe(false);
    });

    it('should create a collection with products', async () => {
      const res = await client.post(
        BASE,
        {
          name: `Test Collection ${Date.now()}`,
          slug: `test-col-${Date.now()}`,
          isActive: true,
          products: [{ productId: SEEDED_PRODUCT_1_ID, position: 0 }],
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      createdCollectionId = res.data.data?.assortmentCollectionId;
      expect(createdCollectionId).toBeTruthy();
    });

    it('should list all collections', async () => {
      const res = await client.get(BASE, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should return members when fetching a collection', async () => {
      if (!createdCollectionId) return;
      const res = await client.get(`${BASE}/${createdCollectionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.data?.assortmentCollectionId).toBe(createdCollectionId);
      expect(Array.isArray(res.data.data?.members)).toBe(true);
      expect(res.data.data.members.length).toBe(1);
    });

    it('should update a collection and add another product', async () => {
      if (!createdCollectionId) return;
      const res = await client.put(
        `${BASE}/${createdCollectionId}`,
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
        `${BASE}/00000000-0000-0000-0000-999999999999`,
        { name: 'Ghost', slug: 'ghost' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(404);
    });

    it('should soft-delete a collection', async () => {
      if (!createdCollectionId) return;
      const res = await client.delete(`${BASE}/${createdCollectionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      createdCollectionId = null;
    });
  });

  describe('Collection product removal', () => {
    // Seeded collection + map item (seeds/20240805001059_seedProductTestExtended.js)
    const removeCollectionId = 'd0000000-0000-0000-0000-000000000001';
    const mapItemId = 'd0000000-0000-0000-0000-000000000002';

    it('should remove products from a collection via removeMapIds', async () => {
      const res = await client.put(
        `${BASE}/${removeCollectionId}`,
        { removeMapIds: [mapItemId] },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);

      // Verify the map item is gone via the member list
      const check = await client.get(`${BASE}/${removeCollectionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const remainingIds = (check.data.data?.members || []).map((m: Record<string, unknown>) => m.assortmentCollectionMapId);
      expect(remainingIds).not.toContain(mapItemId);
    });
  });

  describe('Collection publications', () => {
    let pubCollectionId: string | null = null;

    it('should create a collection for scoping', async () => {
      const res = await client.post(
        BASE,
        { name: `Pub Collection ${Date.now()}`, slug: `pub-collection-${Date.now()}` },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      pubCollectionId = res.data.data?.assortmentCollectionId;
      expect(pubCollectionId).toBeTruthy();
    });

    it('should create a store-scoped publication with merchandising order', async () => {
      if (!pubCollectionId) return;
      const res = await client.post(
        `${BASE}/${pubCollectionId}/publications`,
        { storeId: '20000000-0000-0000-0000-000000000001', sortOrder: 2 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.data?.storeId).toBe('20000000-0000-0000-0000-000000000001');
      expect(res.data.data?.sortOrder).toBe(2);
    });

    it('should upsert the same scope instead of duplicating', async () => {
      if (!pubCollectionId) return;
      const res = await client.post(
        `${BASE}/${pubCollectionId}/publications`,
        { storeId: '20000000-0000-0000-0000-000000000001', sortOrder: 7 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);

      const list = await client.get(`${BASE}/${pubCollectionId}/publications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(list.data.data).toHaveLength(1);
      expect(list.data.data[0].sortOrder).toBe(7);
    });

    it('should delete a publication', async () => {
      if (!pubCollectionId) return;
      const list = await client.get(`${BASE}/${pubCollectionId}/publications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const publicationId = list.data.data?.[0]?.assortmentCollectionPublicationId;
      expect(publicationId).toBeTruthy();

      const res = await client.delete(`${BASE}/${pubCollectionId}/publications/${publicationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);

      const after = await client.get(`${BASE}/${pubCollectionId}/publications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(after.data.data).toHaveLength(0);
    });

    it('should return 404 for publications of a missing collection', async () => {
      const res = await client.get(`${BASE}/00000000-0000-0000-0000-000000000000/publications`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });
  });
});
