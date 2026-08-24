/**
 * Per-endpoint query-count budget tests (N+1 detection).
 *
 * Each test hits a list-style endpoint and asserts that the SQL query count
 * stays within a per-endpoint budget. The server's query-count middleware
 * (active in dev/test mode) injects an `X-Query-Count` response header.
 *
 * These tests catch N+1 regressions: if a refactor accidentally introduces
 * a per-item SQL loop, the query count will spike and the test will fail.
 */

import type { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser } from './testUtils';
import { expectQueryBudget } from './helpers/queryBudget';

describe('Endpoint query-count budget tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client);
  });

  describe('Product list endpoints', () => {
    it('GET /customer/products — list products ≤ 15 queries', async () => {
      const res = await client.get('/customer/products?limit=20', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(200);
      expectQueryBudget(res, 15, 'GET /customer/products');
    });

    it('GET /customer/products/:id — single product detail ≤ 12 queries', async () => {
      const listRes = await client.get('/customer/products?limit=1', {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const productId = listRes.data.data.products[0]?.productId;
      if (!productId) return; // skip if no seeded data

      const res = await client.get(`/customer/products/${productId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect(res.status).toBe(200);
      expectQueryBudget(res, 12, `GET /customer/products/${productId}`);
    });
  });

  describe('Basket endpoints', () => {
    it('POST /basket — get or create basket ≤ 8 queries', async () => {
      const res = await client.post('/basket', {}, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      expect([200, 201]).toContain(res.status);
      expectQueryBudget(res, 8, 'POST /basket');
    });
  });

  describe('Order list endpoints', () => {
    it('GET /business/orders — list orders ≤ 15 queries', async () => {
      const res = await client.get('/business/orders?limit=20', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expectQueryBudget(res, 15, 'GET /business/orders');
    });

    it('GET /business/orders/:orderId — order detail ≤ 15 queries', async () => {
      const listRes = await client.get('/business/orders?limit=1', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const orderId = listRes.data.data?.orders?.[0]?.orderId
        ?? listRes.data.data?.[0]?.orderId;
      if (!orderId) return; // skip if no seeded data

      const res = await client.get(`/business/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      expectQueryBudget(res, 15, `GET /business/orders/${orderId}`);
    });
  });
});
