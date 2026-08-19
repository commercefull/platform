/**
 * Integration tests for category management
 * Covers: spec 04-categories.md
 * - Category CRUD
 * - Parent/child tree
 * - Root categories
 * - Featured / menu filters
 * - Customer-facing category browsing
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';

;

describe('Category Management', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let rootCategoryId: string | null = null;
  let childCategoryId: string | null = null;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    for (const id of [childCategoryId, rootCategoryId]) {
      if (id) {
        await client
          .delete(`/business/categories/${id}`, { headers: { Authorization: `Bearer ${adminToken}` } })
          .catch(() => {});
      }
    }
  });

  // ── Business CRUD ────────────────────────────────────────────────────────

  describe('Business: Category CRUD', () => {
    it('should create a root category', async () => {
      const res = await client.post(
        '/business/categories',
        {
          name: `Root Cat ${Date.now()}`,
          description: 'Root category for tests',
          isActive: true,
          isFeatured: true,
          includeInMenu: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      rootCategoryId =
        res.data.data?.productCategoryId ||
        res.data.data?.categoryId ||
        res.data.data?.id;
      expect(rootCategoryId).toBeTruthy();
    });

    it('should create a child category under the root', async () => {
      if (!rootCategoryId) return;
      const res = await client.post(
        '/business/categories',
        {
          name: `Child Cat ${Date.now()}`,
          parentId: rootCategoryId,
          isActive: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
      childCategoryId =
        res.data.data?.productCategoryId ||
        res.data.data?.categoryId ||
        res.data.data?.id;
      // depth should be > 0 for a child
      expect(res.data.data.depth).toBeGreaterThan(0);
    });

    it('should get a category by ID', async () => {
      if (!rootCategoryId) return;
      const res = await client.get(`/business/categories/${rootCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
    });

    it('should get a category by slug', async () => {
      if (!rootCategoryId) return;
      // First get the category to find its slug
      const getRes = await client.get(`/business/categories/${rootCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const slug = getRes.data.data?.slug;
      if (!slug) return;

      const res = await client.get(`/business/categories/slug/${slug}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      const returnedId = res.data.data?.productCategoryId || res.data.data?.id;
      expect(returnedId).toBe(rootCategoryId);
    });

    it('should list all categories', async () => {
      const res = await client.get('/business/categories', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should list root categories', async () => {
      const res = await client.get('/business/categories/root', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      // All returned categories should have no parentId
      res.data.data.forEach((cat: Record<string, unknown>) => {
        expect(cat.parentId == null).toBe(true);
      });
    });

    it('should list children of a category', async () => {
      if (!rootCategoryId) return;
      const res = await client.get(`/business/categories/${rootCategoryId}/children`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      if (childCategoryId) {
        const ids = res.data.data.map((c: Record<string, unknown>) => c.productCategoryId || c.categoryId || c.id);
        expect(ids).toContain(childCategoryId);
      }
    });

    it('should update a category', async () => {
      if (!rootCategoryId) return;
      const res = await client.put(
        `/business/categories/${rootCategoryId}`,
        { description: 'Updated description' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(res.data.data.description).toBe('Updated description');
    });

    it('should return 404 for non-existent category', async () => {
      const res = await client.get('/business/categories/00000000-0000-0000-0000-999999999999', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
    });

    it('should delete a category', async () => {
      if (!childCategoryId) return;
      const res = await client.delete(`/business/categories/${childCategoryId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      childCategoryId = null;
    });
  });

  // ── Customer-facing ──────────────────────────────────────────────────────

  describe('Customer: Category browsing', () => {
    it('should list active categories', async () => {
      const res = await client.get('/customer/categories');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should list featured categories', async () => {
      const res = await client.get('/customer/categories?featured=true');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      res.data.data.forEach((cat: Record<string, unknown>) => {
        expect(cat.isFeatured).toBe(true);
      });
    });

    it('should list menu categories', async () => {
      const res = await client.get('/customer/categories?menu=true');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should list root categories', async () => {
      const res = await client.get('/customer/categories?root=true');
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
    });

    it('should return 404 for inactive or non-existent category', async () => {
      const res = await client.get('/customer/categories/00000000-0000-0000-0000-999999999999');
      expect(res.status).toBe(404);
    });
  });
});
