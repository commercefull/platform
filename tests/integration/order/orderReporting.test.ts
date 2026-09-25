/**
 * Order Reporting Endpoints Integration Tests
 *
 * Covers endpoints missed by order.test.ts / orderStatus.test.ts / orderOps.test.ts:
 * - GET /business/orders/stats (unfiltered + filtered)
 * - GET /business/orders/store-summary
 * - GET /business/orders/:orderId/history
 * - GET /business/orders/:orderId/packages (requires fulfillmentId query param)
 *
 * Fixtures from seeds/20240805000495_seedTestOrder.js:
 * order ...0200, fulfillment ...0210, package ...0211, status history ...0230.
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

const ORDER_ID = '00000000-0000-0000-0000-000000000200';
const FULFILLMENT_ID = '00000000-0000-0000-0000-000000000210';
const PACKAGE_ID = '00000000-0000-0000-0000-000000000211';

describe('Order Reporting Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('GET /business/orders/stats', () => {
    it('returns aggregate order statistics', async () => {
      const resp = await client.get('/business/orders/stats', auth());
      expectStatus(resp, 200);
      const stats = resp.data.data as Record<string, unknown>;
      expect(typeof stats.totalOrders).toBe('number');
      expect(stats.totalOrders as number).toBeGreaterThan(0);
      expect(stats).toHaveProperty('totalRevenueCents');
      expect(stats).toHaveProperty('ordersByStatus');
    });

    it('filters statistics by customerId', async () => {
      // The order owner's ID is generated per-database — fetch it live
      const order = await client.get(`/business/orders/${ORDER_ID}`, auth());
      expectStatus(order, 200);
      const customerId = (order.data.data as Record<string, unknown>).customerId as string;
      expect(customerId).toBeTruthy();

      const resp = await client.get(`/business/orders/stats?customerId=${customerId}`, auth());
      expectStatus(resp, 200);
      const stats = resp.data.data as Record<string, unknown>;
      expect(stats.totalOrders as number).toBeGreaterThan(0);
    });

    it('returns zeroed stats for a customer with no orders', async () => {
      const resp = await client.get('/business/orders/stats?customerId=00000000-0000-0000-0000-000000099999', auth());
      expectStatus(resp, 200);
      expect((resp.data.data as Record<string, unknown>).totalOrders).toBe(0);
    });
  });

  describe('GET /business/orders/store-summary', () => {
    it('returns per-store sales summaries for the default window', async () => {
      const resp = await client.get('/business/orders/store-summary', auth());
      expectStatus(resp, 200);
      const summary = resp.data.data as Array<Record<string, unknown>>;
      expect(Array.isArray(summary)).toBe(true);
    });

    it('accepts an explicit date range', async () => {
      const resp = await client.get(
        '/business/orders/store-summary?dateFrom=2020-01-01&dateTo=2030-01-01',
        auth(),
      );
      expectStatus(resp, 200);
      const summary = resp.data.data as Array<Record<string, unknown>>;
      expect(Array.isArray(summary)).toBe(true);
      if (summary.length > 0) {
        expect(summary[0]).toHaveProperty('storeName');
        expect(summary[0]).toHaveProperty('totalOrders');
        expect(summary[0]).toHaveProperty('topProducts');
      }
    });
  });

  describe('GET /business/orders/:orderId/history', () => {
    it('returns the seeded status history for the order', async () => {
      const resp = await client.get(`/business/orders/${ORDER_ID}/history`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.orderId).toBe(ORDER_ID);
      const history = resp.data.data.history as Array<Record<string, unknown>>;
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('returns empty history for an unknown order', async () => {
      const resp = await client.get('/business/orders/00000000-0000-0000-0000-000000099999/history', auth());
      expectStatus(resp, 200);
      expect(resp.data.data.history).toHaveLength(0);
    });
  });

  describe('GET /business/orders/:orderId/packages', () => {
    it('requires the fulfillmentId query parameter', async () => {
      const resp = await client.get(`/business/orders/${ORDER_ID}/packages`, auth());
      expectStatus(resp, 400);
    });

    it('lists packages for the seeded fulfillment', async () => {
      const resp = await client.get(`/business/orders/${ORDER_ID}/packages?fulfillmentId=${FULFILLMENT_ID}`, auth());
      expectStatus(resp, 200);
      const packages = resp.data.data.packages as Array<Record<string, unknown>>;
      expect(Array.isArray(packages)).toBe(true);
      expect(packages.some(p => p.orderFulfillmentPackageId === PACKAGE_ID)).toBe(true);
    });
  });
});
