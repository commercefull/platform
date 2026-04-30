/**
 * Customer: Category Browsing
 * Covers: docs/specs/product/merchant/04-categories.md §3
 */

import { AxiosInstance } from 'axios';
import { createTestClient } from '../../testUtils';

;

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
});
