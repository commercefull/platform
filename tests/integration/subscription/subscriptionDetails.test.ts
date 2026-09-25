/**
 * Subscription Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by subscription.test.ts / subscriptionExpanded.test.ts:
 * - DELETE /business/subscriptions/products/:id
 * - POST /business/subscriptions/:id/cancel (admin)
 * - PUT /business/subscriptions/:id/status
 * - GET /business/subscriptions/:subscriptionId/orders
 * - GET /business/subscriptions/:subscriptionId/dunning
 *
 * Fixtures from seeds/20240805001700_seedSubscriptionTestData.js.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';
import {
  SEEDED_CUSTOMER_SUBSCRIPTION_IDS,
  createTestSubscriptionProduct,
} from './testUtils';
import { createTestProduct } from '../product/testUtils';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Subscription Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Subscription product delete', () => {
    it('POST + DELETE /business/subscriptions/products/:id removes a subscription product', async () => {
      // productId is unique on subscriptionProduct — use a fresh product
      const productId = await createTestProduct(client, adminToken);
      expect(productId).toBeTruthy();

      const create = await client.post(
        '/business/subscriptions/products',
        createTestSubscriptionProduct(productId as string),
        auth(),
      );
      expectStatus(create, 201);
      const subProductId = create.data.data.subscriptionProductId || create.data.data.id;
      const del = await client.delete(`/business/subscriptions/products/${subProductId}`, auth());
      expectStatus(del, 200);
    });

    it('DELETE /business/subscriptions/products/:id returns 404 for unknown ids', async () => {
      const resp = await client.delete(`/business/subscriptions/products/${UNKNOWN_ID}`, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Admin subscription lifecycle', () => {
    it('PUT /business/subscriptions/:id/status updates the status', async () => {
      const resp = await client.put(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}/status`,
        { status: 'paused' },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('POST /business/subscriptions/:id/resume resumes a paused subscription', async () => {
      const resp = await client.post(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.PAUSED_WEEKLY}/resume`,
        {},
        auth(),
      );
      // PAUSED_WEEKLY is seeded paused — resume must succeed
      expectStatus(resp, 200);
    });

    it('POST /business/subscriptions/:id/cancel cancels a subscription', async () => {
      const resp = await client.post(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}/cancel`,
        { reason: 'Coverage cancel', cancelAtPeriodEnd: false },
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('POST /business/subscriptions/:id/cancel returns 404 for unknown ids', async () => {
      const resp = await client.post(`/business/subscriptions/${UNKNOWN_ID}/cancel`, { reason: 'x' }, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Subscription orders and dunning', () => {
    it('GET /business/subscriptions/:id/orders lists orders', async () => {
      const resp = await client.get(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}/orders`,
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data !== undefined).toBe(true);
    });

    it('GET /business/subscriptions/:id/dunning lists dunning attempts', async () => {
      const resp = await client.get(
        `/business/subscriptions/${SEEDED_CUSTOMER_SUBSCRIPTION_IDS.ACTIVE_MONTHLY}/dunning`,
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data !== undefined).toBe(true);
    });

    it('GET /business/subscriptions/:id/orders returns empty for unknown ids', async () => {
      const resp = await client.get(`/business/subscriptions/${UNKNOWN_ID}/orders`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data).toEqual([]);
    });
  });
});
