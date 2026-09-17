/**
 * Customer: Category Browsing
 * Covers: docs/specs/product/organization/04-categories.md §3
 */

import { AxiosInstance } from 'axios';
import { createTestClient } from '../../testUtils';

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
    res.data.data.forEach((cat: Record<string, unknown>) => {
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
    // Seeded parent/child pair (seeds/20240805000208_seedProductCategory.js)
    const parentId = 'c0000000-0000-0000-0000-000000000010';
    const childId = 'c0000000-0000-0000-0000-000000000011';

    it('should list children of a category', async () => {
      if (!parentId) return;
      const res = await client.get(`/customer/categories/${parentId}/children`);
      expect(res.status).toBe(200);
      expect(res.data.success).toBe(true);
      expect(Array.isArray(res.data.data)).toBe(true);
      if (childId) {
        const ids = res.data.data.map((c: Record<string, unknown>) => c.productCategoryId || c.categoryId || c.id);
        expect(ids).toContain(childId);
      }
    });

    it('should return empty array for non-existent category children', async () => {
      const res = await client.get('/customer/categories/00000000-0000-0000-0000-999999999999/children');
      // Controller returns empty array for non-existent parent, not 404
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data.data)).toBe(true);
      expect(res.data.data.length).toBe(0);
    });
  });
});
