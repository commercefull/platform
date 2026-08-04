/**
 * Customer: Category Browsing
 * Covers: docs/specs/product/merchant/04-categories.md §3
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../../testUtils';

describe('Customer: Category Browsing', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = createTestClient();
  });

  it('should list active categories', async () => {
    const res = await client.get('/customer/categories');
    expect(res.status).toBe(200);
    expect(res.data.success).toBe(true);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should list featured categories', async () => {
    const res = await client.get('/customer/categories?featured=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
    res.data.data.forEach((cat: any) => {
      expect(cat.isFeatured).toBe(true);
    });
  });

  it('should list menu categories', async () => {
    const res = await client.get('/customer/categories?menu=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should list root categories', async () => {
    const res = await client.get('/customer/categories?root=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.data.data)).toBe(true);
  });

  it('should return 404 for non-existent category', async () => {
    const res = await client.get('/customer/categories/00000000-0000-0000-0000-999999999999');
    expect(res.status).toBe(404);
  });

  describe('Category children', () => {
    let adminToken: string;
    let parentId: string | null = null;
    let childId: string | null = null;

    beforeAll(async () => {
      adminToken = await loginTestAdmin(client);
      const parentRes = await client.post(
        '/business/categories',
        {
          name: `Customer Children Parent ${Date.now()}`,
          isActive: true,
          includeInMenu: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      parentId =
        parentRes.data.data?.productCategoryId ||
        parentRes.data.data?.categoryId ||
        parentRes.data.data?.id;

      const childRes = await client.post(
        '/business/categories',
        {
          name: `Customer Children Child ${Date.now()}`,
          parentId,
          isActive: true,
        },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );
      childId =
        childRes.data.data?.productCategoryId ||
        childRes.data.data?.categoryId ||
        childRes.data.data?.id;
    });

    afterAll(async () => {
      for (const id of [childId, parentId]) {
        if (id) {
          await client
            .delete(`/business/categories/${id}`, {
              headers: { Authorization: `Bearer ${adminToken}` },
            })
            .catch(() => {});
        }
      }
    });

    it('should list children of a category', async () => {
      if (!parentId) return;
      const res = await client.get(`/customer/categories/${parentId}/children`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      if (childId) {
        const ids = res.data.data.map((c: any) => c.productCategoryId || c.categoryId || c.id);
        expect(ids).toContain(childId);
      }
    });

    it('should return empty array for non-existent category children', async () => {
      const res = await client.get(
        '/customer/categories/00000000-0000-0000-0000-999999999999/children',
      );
      // Controller returns empty array for non-existent parent, not 404
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBe(0);
    });
  });
});
