/**
 * Miscellaneous Customer Endpoint Integration Tests
 *
 * Covers uncovered single endpoints across modules:
 * - GET /customer/tax/rates
 * - GET /customer/stores + /customer/stores/:storeId
 * - GET /customer/products/:productId/availability
 * - GET /customer/fulfillments/order/:orderId + /:fulfillmentId/track
 * - GET /customer/search (regression: was shadowed by /customer/:fulfillmentId)
 * - DELETE /customer/payment-methods/:methodId
 * - DELETE /business/theme/:themeId
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

const SEEDED_ORDER_ID = '00000000-0000-0000-0000-000000000200';
const SEEDED_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';
const SEEDED_STORE_ID = '20000000-0000-0000-0000-000000000001';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Miscellaneous Endpoint Coverage', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });
  const customerAuth = () => ({ headers: { Authorization: `Bearer ${customerToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'customer@example.com', 'password123');
  });

  describe('Customer tax', () => {
    it('GET /customer/tax/rates lists rates', async () => {
      const resp = await client.get('/customer/tax/rates', customerAuth());
      expectStatus(resp, 200);
      // Endpoint returns a bare array (no success/data envelope)
      expect(Array.isArray(resp.data)).toBe(true);
    });
  });

  describe('Customer stores', () => {
    it('GET /customer/stores lists stores', async () => {
      const resp = await client.get('/customer/stores', customerAuth());
      expectStatus(resp, 200);
      expect(Array.isArray(resp.data.data) || resp.data.data.stores !== undefined).toBe(true);
    });

    it('GET /customer/stores/:storeId returns the store', async () => {
      const resp = await client.get(`/customer/stores/${SEEDED_STORE_ID}`, customerAuth());
      expectStatus(resp, 200);
      // Response shape: { data: store } (no success flag)
      expect(resp.data.data.storeId).toBe(SEEDED_STORE_ID);
    });
  });

  describe('Product availability', () => {
    it('GET /customer/products/:productId/availability returns stock info', async () => {
      const resp = await client.get(`/customer/products/${SEEDED_PRODUCT_ID}/availability`, customerAuth());
      expectStatus(resp, 200);
      expect(resp.data.data.productId).toBe(SEEDED_PRODUCT_ID);
    });
  });

  describe('Fulfillment tracking', () => {
    it('GET /customer/fulfillments/order/:orderId lists fulfillments + tracks one', async () => {
      const resp = await client.get(`/customer/fulfillments/order/${SEEDED_ORDER_ID}`, customerAuth());
      expectStatus(resp, 200);

      // Seeded order 0...200 has a seeded fulfillment
      const items = resp.data.data;
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
      const fulfillmentId = items[0].fulfillmentId || items[0].id;
      const track = await client.get(`/customer/fulfillments/${fulfillmentId}/track`, customerAuth());
      expectStatus(track, 200);
      expect(track.data.data.fulfillmentId).toBe(fulfillmentId);
    });

    it('GET /customer/search is not swallowed by /customer/:fulfillmentId', async () => {
      // Regression: the fulfillment customer router used to mount at bare /customer,
      // so GET /customer/search was parsed as a fulfillment lookup → 400.
      const resp = await client.get('/customer/search', { ...customerAuth(), params: { q: 'test' } });
      expectStatus(resp, 200);
    });
  });

  describe('Stored payment methods', () => {
    it('POST + DELETE /customer/payment-methods/:methodId removes a stored method', async () => {
      const create = await client.post(
        '/customer/payment-methods',
        {
          type: 'creditCard',
          provider: 'stripe',
          providerToken: `tok_cov_${Date.now()}`,
          last4: '4242',
          brand: 'visa',
          expiryMonth: 12,
          expiryYear: 2030,
        },
        customerAuth(),
      );
      expectStatus(create, 201);
      const methodId = create.data.data.storedPaymentMethodId;

      const del = await client.delete(`/customer/payment-methods/${methodId}`, customerAuth());
      expectStatus(del, 200);
    });

    it('DELETE /customer/payment-methods/:methodId rejects unknown ids', async () => {
      const resp = await client.delete(`/customer/payment-methods/${UNKNOWN_ID}`, customerAuth());
      expectStatus(resp, 404);
    });

    it('DELETE /customer/payment-methods/:methodId requires auth', async () => {
      const resp = await client.delete(`/customer/payment-methods/${UNKNOWN_ID}`);
      expectStatus(resp, 401);
    });
  });

  describe('Theme delete', () => {
    it('POST + DELETE /business/theme/:themeId removes a theme', async () => {
      const create = await client.post(
        '/business/theme',
        { name: `Cov Theme ${Date.now()}`, slug: `cov-theme-${Date.now()}` },
        auth(),
      );
      expectStatus(create, 201);
      const themeId = create.data.data.themeId || create.data.data.id;

      const del = await client.delete(`/business/theme/${themeId}`, auth());
      expectStatus(del, 200);
    });
  });
});
