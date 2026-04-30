/**
 * Customer: Bundles
 * Covers: docs/specs/product/customer.md §2.5
 */

import { AxiosInstance } from 'axios';
import { createTestClient } from '../../testUtils';
import { SEEDED_BUNDLE_1_ID, SEEDED_PRODUCT_1_ID, SEEDED_PRODUCT_2_ID } from '../testUtils';

;
;

describe('Customer: Bundles', () => {
  let client: AxiosInstance;

  beforeAll(async () => {
    client = createTestClient();
  });

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
