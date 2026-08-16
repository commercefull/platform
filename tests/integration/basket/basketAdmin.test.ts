/**
 * Basket Admin/Business API Integration Tests
 * Tests basket management endpoints for admin/merchant users
 */

import axios, { AxiosInstance } from 'axios';
import { loginTestAdmin, expectStatus } from '../testUtils';
import { TEST_GUEST_BASKET_ID, CUSTOMER_CREDENTIALS } from '../testConstants';

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

describe('Basket Admin/Business API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testBasketId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    adminToken = await loginTestAdmin(client);

    // Get customer token for creating test baskets
    try {
      const customerLoginResponse = await client.post(
        '/customer/identity/login',
        CUSTOMER_CREDENTIALS,
        { headers: { 'X-Test-Request': 'true' } },
      );
      customerToken = customerLoginResponse.data?.accessToken || '';
    } catch {
      customerToken = '';
    }
  });

  // Helper to create a test basket
  const createTestBasket = async (): Promise<string | null> => {
    if (!customerToken) return null;
    const response = await client.post(
      '/customer/basket',
      { sessionId: `admin-test-${Date.now()}-${Math.random()}` },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    if (response.status !== 200 || !response.data?.data?.basketId) return null;
    return response.data.data.basketId;
  };

  // Helper to add an item to a basket
  const addItemToBasket = async (basketId: string): Promise<void> => {
    await client.post(
      `/customer/basket/${basketId}/items`,
      {
        productId: '10000000-0000-0000-0000-000000000001',
        sku: 'TEST-SKU-001',
        name: 'Test Product',
        quantity: 2,
        unitPrice: 29.99,
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
  };

  // ============================================================================
  // Basket Listing Tests
  // ============================================================================

  describe('Basket Listing', () => {
    it('should list baskets with admin auth', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/basket', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should support pagination parameters', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/basket?limit=5&offset=0', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should require auth for listing baskets', async () => {
      const response = await client.get('/business/basket');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/basket', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Basket Retrieval Tests
  // ============================================================================

  describe('Basket Retrieval', () => {
    it('should get a basket by ID with admin auth', async () => {
      if (!adminToken) return;

      const response = await client.get(`/business/basket/${TEST_GUEST_BASKET_ID}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('basketId');
    });

    it('should get basket summary with admin auth', async () => {
      if (!adminToken) return;

      const response = await client.get(`/business/basket/${TEST_GUEST_BASKET_ID}/summary`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('basketId');
      expect(response.data.data).toHaveProperty('itemCount');
      expect(response.data.data).toHaveProperty('subtotal');
    });

    it('should return 404 for non-existent basket', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/basket/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });
  });

  // ============================================================================
  // Basket Coupon Management Tests
  // ============================================================================

  describe('Basket Coupon Management', () => {
    beforeAll(async () => {
      testBasketId = (await createTestBasket()) || '';
      if (testBasketId) {
        await addItemToBasket(testBasketId);
      }
    });

    it('should apply a coupon to a basket (admin override)', async () => {
      if (!adminToken || !testBasketId) return;

      const response = await client.post(
        `/business/basket/${testBasketId}/coupon`,
        { couponCode: 'TESTFIXED10' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should remove a coupon from a basket', async () => {
      if (!adminToken || !testBasketId) return;

      const response = await client.delete(`/business/basket/${testBasketId}/coupon`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should reject applying coupon to non-existent basket', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/basket/00000000-0000-0000-0000-000000000000/coupon',
        { couponCode: 'TESTFIXED10' },
        { headers: { Authorization: `Bearer ${adminToken}` },
      });

      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Basket Assignment Tests
  // ============================================================================

  describe('Basket Assignment', () => {
    it('should assign a basket to a customer', async () => {
      if (!adminToken || !customerToken) return;

      const basketId = await createTestBasket();
      if (!basketId) return;

      const response = await client.post(
        `/business/basket/${basketId}/assign`,
        { customerId: '00000000-0000-0000-0000-000000001001' },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });
  });

  // ============================================================================
  // Basket Expiration Tests
  // ============================================================================

  describe('Basket Expiration Management', () => {
    it('should extend basket expiration with admin auth', async () => {
      if (!adminToken || !customerToken) return;

      const basketId = await createTestBasket();
      if (!basketId) return;

      const response = await client.put(
        `/business/basket/${basketId}/expiration`,
        { days: 14 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should reject invalid expiration days', async () => {
      if (!adminToken || !customerToken) return;

      const basketId = await createTestBasket();
      if (!basketId) return;

      const response = await client.put(
        `/business/basket/${basketId}/expiration`,
        { days: -5 },
        { headers: { Authorization: `Bearer ${adminToken}` } },
      );

      expect(response.status).toBe(400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });
  });

  // ============================================================================
  // Basket Delete Tests
  // ============================================================================

  describe('Basket Delete (Admin)', () => {
    it('should delete a basket with admin auth', async () => {
      if (!adminToken || !customerToken) return;

      const basketId = await createTestBasket();
      if (!basketId) return;

      const response = await client.delete(`/business/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expectStatus(response, 200);
      const verifyResponse = await client.get(`/business/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expectStatus(verifyResponse, 404);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for getting basket by ID', async () => {
      const response = await client.get(`/business/basket/${TEST_GUEST_BASKET_ID}`);
      expect(response.status).toBe(401);
    });

    it('should require auth for basket summary', async () => {
      const response = await client.get(`/business/basket/${TEST_GUEST_BASKET_ID}/summary`);
      expect(response.status).toBe(401);
    });

    it('should require auth for applying coupon', async () => {
      const response = await client.post(
        `/business/basket/${TEST_GUEST_BASKET_ID}/coupon`,
        { couponCode: 'TEST' },
      );
      expect(response.status).toBe(401);
    });

    it('should require auth for removing coupon', async () => {
      const response = await client.delete(`/business/basket/${TEST_GUEST_BASKET_ID}/coupon`);
      expect(response.status).toBe(401);
    });

    it('should require auth for assigning basket', async () => {
      const response = await client.post(
        `/business/basket/${TEST_GUEST_BASKET_ID}/assign`,
        { customerId: 'test' },
      );
      expect(response.status).toBe(401);
    });

    it('should require auth for extending expiration', async () => {
      const response = await client.put(
        `/business/basket/${TEST_GUEST_BASKET_ID}/expiration`,
        { days: 7 },
      );
      expect(response.status).toBe(401);
    });

    it('should require auth for deleting basket', async () => {
      const response = await client.delete(`/business/basket/${TEST_GUEST_BASKET_ID}`);
      expect(response.status).toBe(401);
    });
  });
});
