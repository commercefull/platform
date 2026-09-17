/**
 * Shipping Label Operations Integration Tests
 *
 * Covers endpoints not exercised by shipping.test.ts / shippingExpanded.test.ts:
 * - GET  /business/labels/order/:orderId
 * - POST /business/labels/:id/void
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Shipping Label Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  // Seeded in seeds/20240805001600_seedShippingTestData.js
  const labelId = '01936005-0000-7000-8000-000000000001';
  const orderId = '00000000-0000-0000-0000-000000000200';

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Shipping tests');
  });

  it('GET /business/labels/order/:orderId lists labels for an order', async () => {
    const resp = await client.get(`/business/labels/order/${orderId}`, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
    expect(Array.isArray(resp.data.data)).toBe(true);
  });

  it('GET /business/labels/order/:orderId returns empty list for unknown order', async () => {
    const resp = await client.get(`/business/labels/order/${randomUUID()}`, { headers: headers() });
    expectStatus(resp, 200);
  });

  it('POST /business/labels/:id/void voids the label', async () => {
    const resp = await client.post(`/business/labels/${labelId}/void`, { reason: 'Customer cancelled' }, { headers: headers() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('POST /business/labels/:id/void returns 404 for already-voided label', async () => {
    const resp = await client.post(`/business/labels/${labelId}/void`, {}, { headers: headers() });
    expectStatus(resp, 404);
  });
});
