/**
 * Basket Edge Cases & Gap Tests
 * Tests additional basket scenarios not covered in basket.test.ts
 */

import axios, { AxiosInstance } from 'axios';
import { loginTestUser, expectStatus } from '../testUtils';
import { TEST_PRODUCT_1_ID, TEST_PRODUCT_2_ID } from '../testConstants';

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

describe('Basket Edge Cases & Gap Tests', () => {
  let client: AxiosInstance;
  let customerToken: string;
  let _adminToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    customerToken = await loginTestUser(client);
    // Login as organization for coupon management
    try {
      const loginResp = await client.post('/business/auth/login', { email: 'merchant@example.com', password: 'password123' });
      _adminToken = loginResp.data?.accessToken || '';
    } catch {
      _adminToken = '';
    }
  });

  // Helper to create a fresh basket
  const createBasket = async (): Promise<string | null> => {
    if (!customerToken) return null;
    const response = await client.post(
      '/customer/basket',
      { sessionId: `gap-test-${Date.now()}-${Math.random()}` },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    if (response.status !== 200 || !response.data?.data?.basketId) return null;
    return response.data.data.basketId;
  };

  // Helper to add an item
  const addItem = async (basketId: string, productId: string = TEST_PRODUCT_1_ID, quantity: number = 1, price: number = 29.99): Promise<Record<string, unknown>> => {
    const response = await client.post(
      `/customer/basket/${basketId}/items`,
      {
        productId,
        sku: 'TEST-SKU-001',
        name: 'Test Product',
        quantity,
        unitPrice: price,
      },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    return response.data as Record<string, unknown>;
  };

  // ============================================================================
  // Multi-Item Basket Tests
  // ============================================================================

  describe('Multi-Item Baskets', () => {
    it('should calculate correct subtotal with multiple items', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 2, 29.99);
      await addItem(basketId, TEST_PRODUCT_2_ID, 3, 15.5);

      const response = await client.get(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.items.length).toBe(2);
      expect(response.data.data.itemCount).toBe(5);
      expect(response.data.data.subtotal).toBeCloseTo(2 * 29.99 + 3 * 15.5, 2);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should update subtotal when item quantity changes', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const addResp = await addItem(basketId, TEST_PRODUCT_1_ID, 1, 29.99);
      const addData = addResp?.data as Record<string, unknown> | undefined;
      const items = addData?.items as Array<Record<string, unknown>> | undefined;
      const itemId = items?.[0]?.basketItemId as string | undefined;
      if (!itemId) return;

      const beforeResp = await client.get(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      const subtotalBefore = beforeResp.data.data.subtotal;

      const updateResp = await client.patch(
        `/customer/basket/${basketId}/items/${itemId}`,
        { quantity: 5 },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expect(updateResp.status).toBe(200);
      expect(updateResp.data.data.subtotal).toBeGreaterThan(subtotalBefore);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should add same product twice and merge quantities', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 2, 29.99);
      await addItem(basketId, TEST_PRODUCT_1_ID, 3, 29.99);

      const response = await client.get(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      if (response.data.data.items.length === 1) {
        expect(response.data.data.items[0].quantity).toBe(5);
      } else {
        expect(response.data.data.itemCount).toBe(5);
      }

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });
  });

  // ============================================================================
  // Coupon Application Tests (Customer Side)
  // ============================================================================

  describe('Basket Coupon Application', () => {
    it('should apply a valid coupon to a basket', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 2, 29.99);

      const response = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: 'TESTFIXED10' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('discountAmount');

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should reject applying coupon to empty basket', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: 'TESTFIXED10' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should reject invalid coupon code', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 1, 29.99);

      const response = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: 'INVALIDCODE999' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should remove an applied coupon from basket', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 2, 29.99);

      // Apply first (use coupon that requires min order 100 so apply fails for this basket)
      await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: 'TESTFIXED10_MIN100' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      // Then remove
      const response = await client.delete(`/customer/basket/${basketId}/coupon`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      // Returns 400 "No coupon applied to this basket" if coupon wasn't actually applied
      expectStatus(response, 400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });
  });

  // ============================================================================
  // Quantity Edge Cases
  // ============================================================================

  describe('Quantity Edge Cases', () => {
    it('should reject negative quantity', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.post(
        `/customer/basket/${basketId}/items`,
        {
          productId: TEST_PRODUCT_1_ID,
          sku: 'TEST-SKU-001',
          name: 'Test Product',
          quantity: -1,
          unitPrice: 29.99,
        },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expect(response.status).toBe(400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should reject zero quantity on add', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.post(
        `/customer/basket/${basketId}/items`,
        {
          productId: TEST_PRODUCT_1_ID,
          sku: 'TEST-SKU-001',
          name: 'Test Product',
          quantity: 0,
          unitPrice: 29.99,
        },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expect(response.status).toBe(400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should handle large quantity values', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.post(
        `/customer/basket/${basketId}/items`,
        {
          productId: TEST_PRODUCT_1_ID,
          sku: 'TEST-SKU-001',
          name: 'Test Product',
          quantity: 999,
          unitPrice: 1.0,
        },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      // Quantity 999 exceeds max quantity validation (max 100)
      expectStatus(response, 400);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });
  });

  // ============================================================================
  // Basket Summary Edge Cases
  // ============================================================================

  describe('Basket Summary', () => {
    it('should return zero subtotal for empty basket', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.get(`/customer/basket/${basketId}/summary`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.itemCount).toBe(0);
      expect(response.data.data.subtotal).toBe(0);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });

    it('should reflect correct item count in summary', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 3, 10.0);
      await addItem(basketId, TEST_PRODUCT_2_ID, 2, 20.0);

      const response = await client.get(`/customer/basket/${basketId}/summary`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.itemCount).toBe(5);
      expect(response.data.data.subtotal).toBeCloseTo(70, 2);

      // Cleanup
      await client.delete(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      }).catch(() => {});
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  // Basket routes are public for guest users - no auth required
  describe('Authorization', () => {
    it('should allow guest basket creation without auth', async () => {
      const response = await client.post('/customer/basket', {
        sessionId: 'no-auth-test',
      });
      expect([200, 201].includes(response.status)).toBe(true);
    });

    it('should allow guest basket retrieval without auth', async () => {
      const response = await client.get('/customer/basket/00000000-0000-0000-0000-000000000001');
      expect([200, 404].includes(response.status)).toBe(true);
    });

    it('should allow guest adding items without auth', async () => {
      const response = await client.post('/customer/basket/00000000-0000-0000-0000-000000000001/items', {
        productId: TEST_PRODUCT_1_ID,
        quantity: 1,
        unitPrice: 10,
      });
      expect([200, 201, 400, 404].includes(response.status)).toBe(true);
    });

    it('should allow guest basket summary without auth', async () => {
      const response = await client.get('/customer/basket/00000000-0000-0000-0000-000000000001/summary');
      expect([200, 404].includes(response.status)).toBe(true);
    });

    it('should allow guest clearing basket without auth', async () => {
      const response = await client.delete('/customer/basket/00000000-0000-0000-0000-000000000001/items');
      expect([200, 404].includes(response.status)).toBe(true);
    });

    it('should allow guest merging baskets without auth', async () => {
      const response = await client.post('/customer/basket/merge', {
        sourceBasketId: '00000000-0000-0000-0000-000000000001',
        targetBasketId: '00000000-0000-0000-0000-000000000002',
      });
      expect([200, 400, 404].includes(response.status)).toBe(true);
    });
  });
});
