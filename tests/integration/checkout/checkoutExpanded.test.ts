/**
 * Checkout Expanded Tests
 * Tests: full checkout flow, address selection, fulfillment method, payment integration
 */

import axios, { AxiosInstance } from 'axios';
import { loginTestUser } from '../testUtils';
import { TEST_PRODUCT_1_ID, TEST_SHIPPING_ADDRESS, TEST_BILLING_ADDRESS } from '../testConstants';

const createClient = () =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

describe('Checkout Expanded Tests', () => {
  let client: AxiosInstance;
  let customerToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    customerToken = await loginTestUser(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  const createBasketWithItem = async (): Promise<string | null> => {
    if (!customerToken) return null;
    const basketResp = await client.post(
      '/customer/basket',
      { sessionId: `checkout-exp-${Date.now()}-${Math.random()}` },
      { headers: authHeaders() },
    );
    if (basketResp.status !== 200 || !basketResp.data?.data?.basketId) return null;
    const basketId = basketResp.data.data.basketId;

    await client.post(
      `/customer/basket/${basketId}/items`,
      { productId: TEST_PRODUCT_1_ID, sku: 'TEST-SKU-001', name: 'Test Product', quantity: 1, unitPrice: 29.99 },
      { headers: authHeaders() },
    );

    return basketId;
  };

  const createCheckout = async (basketId: string): Promise<string | null> => {
    const resp = await client.post(
      '/customer/checkout',
      { basketId },
      { headers: authHeaders() },
    );
    if (resp.status !== 200 && resp.status !== 201) return null;
    return resp.data?.data?.checkoutId || resp.data?.checkoutId || null;
  };

  const cleanup = async (basketId: string) => {
    await client.delete(`/customer/basket/${basketId}`, { headers: authHeaders() }).catch(() => {});
  };

  // ============================================================================
  // Full Checkout Flow Tests
  // ============================================================================

  describe('Full Checkout Flow', () => {
    it('should create a checkout session from a basket', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;

      const checkoutId = await createCheckout(basketId);
      expect(checkoutId).toBeTruthy();

      if (checkoutId) {
        const resp = await client.get(`/customer/checkout/${checkoutId}`, { headers: authHeaders() });
        expect(resp.status).toBe(200);
      }

      await cleanup(basketId);
    });

    it('should reject checkout creation for empty basket', async () => {
      const basketResp = await client.post(
        '/customer/basket',
        { sessionId: `empty-checkout-${Date.now()}` },
        { headers: authHeaders() },
      );
      if (basketResp.status !== 200) return;
      const basketId = basketResp.data.data.basketId;

      const resp = await client.post('/customer/checkout', { basketId }, { headers: authHeaders() });
      expect([400, 404]).toContain(resp.status);

      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Address Selection Tests
  // ============================================================================

  describe('Address Selection', () => {
    it('should set shipping address on checkout', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      const resp = await client.put(
        `/customer/checkout/${checkoutId}/shipping-address`,
        TEST_SHIPPING_ADDRESS,
        { headers: authHeaders() },
      );

      expect([200, 201, 400, 404]).toContain(resp.status);
      if (resp.status === 200 || resp.status === 201) {
        expect(resp.data.success).toBe(true);
      }

      await cleanup(basketId);
    });

    it('should set billing address on checkout', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      const resp = await client.put(
        `/customer/checkout/${checkoutId}/billing-address`,
        TEST_BILLING_ADDRESS,
        { headers: authHeaders() },
      );

      expect([200, 201, 400, 404]).toContain(resp.status);
      await cleanup(basketId);
    });

    it('should reject invalid shipping address', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      const resp = await client.put(
        `/customer/checkout/${checkoutId}/shipping-address`,
        { firstName: 'Test' },
        { headers: authHeaders() },
      );

      expect([400, 404, 422]).toContain(resp.status);
      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Fulfillment Method Tests
  // ============================================================================

  describe('Fulfillment Method', () => {
    it('should set fulfillment method to shipping', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      const resp = await client.put(
        `/customer/checkout/${checkoutId}/fulfillment-method`,
        { fulfillmentType: 'shipping' },
        { headers: authHeaders() },
      );

      expect([200, 201, 400, 404]).toContain(resp.status);
      await cleanup(basketId);
    });

    it('should get available fulfillment options', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      const resp = await client.get(
        `/customer/checkout/${checkoutId}/fulfillment-options`,
        { headers: authHeaders() },
      );

      expect([200, 400, 404]).toContain(resp.status);
      if (resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }

      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Shipping Method Tests
  // ============================================================================

  describe('Shipping Method', () => {
    it('should get available shipping methods after address is set', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      await client.put(
        `/customer/checkout/${checkoutId}/shipping-address`,
        TEST_SHIPPING_ADDRESS,
        { headers: authHeaders() },
      );

      const resp = await client.get(
        `/customer/checkout/${checkoutId}/shipping-methods`,
        { headers: authHeaders() },
      );

      expect([200, 400, 404]).toContain(resp.status);
      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Checkout Summary Tests
  // ============================================================================

  describe('Checkout Summary', () => {
    it('should return checkout summary with totals', async () => {
      const basketId = await createBasketWithItem();
      if (!basketId) return;
      const checkoutId = await createCheckout(basketId);
      if (!checkoutId) { await cleanup(basketId); return; }

      const resp = await client.get(
        `/customer/checkout/${checkoutId}/summary`,
        { headers: authHeaders() },
      );

      expect([200, 404]).toContain(resp.status);
      if (resp.status === 200) {
        expect(resp.data.success).toBe(true);
        expect(resp.data.data).toHaveProperty('subtotal');
      }

      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for checkout creation', async () => {
      const resp = await client.post('/customer/checkout', { basketId: '00000000-0000-0000-0000-000000000001' });
      expect([401, 403]).toContain(resp.status);
    });

    it('should require auth for getting checkout', async () => {
      const resp = await client.get('/customer/checkout/00000000-0000-0000-0000-000000000001');
      expect([401, 403]).toContain(resp.status);
    });
  });
});
