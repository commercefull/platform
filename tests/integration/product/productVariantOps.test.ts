/**
 * Product Variant Operations Integration Tests
 *
 * Covers the product-scoped variant routes not exercised elsewhere:
 * - GET    /business/products/:productId/variants/:variantId
 * - PUT    /business/products/:productId/variants/:variantId
 * - DELETE /business/products/:productId/variants/:variantId
 *
 * Existing tests cover the unscoped /business/products/variants/:variantId routes.
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Product Variant Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  // Seeded in seeds/20240805001058_seedProductTestData.js:
  // product 2 with a non-default variant that can be updated/deleted
  const productId = '00000000-0000-0000-0000-000000000002';
  const variantId = '20000000-0000-0000-0000-000000000002';

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Product tests');
  });

  it('GET /business/products/:productId/variants/:variantId returns the variant', async () => {
    const resp = await client.get(`/business/products/${productId}/variants/${variantId}`, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('PUT /business/products/:productId/variants/:variantId updates the variant', async () => {
    const resp = await client.put(
      `/business/products/${productId}/variants/${variantId}`,
      { name: 'Updated Variant', price: 79.99 },
      { headers: headers() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('GET /business/products/:productId/variants/:variantId returns 404 for unknown variant', async () => {
    const resp = await client.get(`/business/products/${productId}/variants/${randomUUID()}`, { headers: headers() });
    expectStatus(resp, 404);
  });

  it('DELETE /business/products/:productId/variants/:variantId deletes a non-default variant', async () => {
    // Seeded variant is non-default (isDefault: false), so it can be deleted
    const resp = await client.delete(`/business/products/${productId}/variants/${variantId}`, { headers: headers() });
    expectStatus(resp, 200);

    const after = await client.get(`/business/products/${productId}/variants/${variantId}`, { headers: headers() });
    expectStatus(after, 404);
  });
});
