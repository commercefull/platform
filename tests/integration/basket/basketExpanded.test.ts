/**
 * Basket Expanded Tests
 * Tests: merge, gift wrapping, expiration, clear, and item removal
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

describe('Basket Expanded Tests', () => {
  let client: AxiosInstance;
  let customerToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createClient();
    customerToken = await loginTestUser(client);
  });

  const createBasket = async (): Promise<string | null> => {
    if (!customerToken) return null;
    const response = await client.post(
      '/customer/basket',
      { sessionId: `exp-test-${Date.now()}-${Math.random()}` },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    if (response.status !== 200 || !response.data?.data?.basketId) return null;
    return response.data.data.basketId;
  };

  const addItem = async (basketId: string, productId: string = TEST_PRODUCT_1_ID, quantity: number = 1, price: number = 29.99): Promise<Record<string, unknown>> => {
    const response = await client.post(
      `/customer/basket/${basketId}/items`,
      { productId, sku: 'TEST-SKU-001', name: 'Test Product', quantity, unitPrice: price },
      { headers: { Authorization: `Bearer ${customerToken}` } },
    );
    return response.data as Record<string, unknown>;
  };

  const cleanup = async (basketId: string) => {
    await client.delete(`/customer/basket/${basketId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    }).catch(() => {});
  };

  // ============================================================================
  // Basket Merge Tests
  // ============================================================================

  describe('Basket Merge', () => {
    it('should merge two baskets into one', async () => {
      const sourceId = await createBasket();
      const targetId = await createBasket();
      if (!sourceId || !targetId) return;

      await addItem(sourceId, TEST_PRODUCT_1_ID, 2, 29.99);
      await addItem(targetId, TEST_PRODUCT_2_ID, 1, 15.5);

      const response = await client.post(
        '/customer/basket/merge',
        { sourceBasketId: sourceId, targetBasketId: targetId },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);

      await cleanup(sourceId);
      await cleanup(targetId);
    });

    it('should reject merge with non-existent source basket', async () => {
      const targetId = await createBasket();
      if (!targetId) return;

      const response = await client.post(
        '/customer/basket/merge',
        { sourceBasketId: '00000000-0000-0000-0000-000000000000', targetBasketId: targetId },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 404);
      await cleanup(targetId);
    });
  });

  // ============================================================================
  // Gift Wrapping Tests
  // ============================================================================

  describe('Gift Wrapping', () => {
    it('should set item as gift with message', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const addResp = await addItem(basketId, TEST_PRODUCT_1_ID, 1, 29.99);
      const addData = addResp?.data as Record<string, unknown> | undefined;
      const items = addData?.items as Array<Record<string, unknown>> | undefined;
      const itemId = items?.[0]?.basketItemId as string | undefined;
      if (!itemId) return;

      const response = await client.post(
        `/customer/basket/${basketId}/items/${itemId}/gift`,
        { isGift: true, giftMessage: 'Happy Birthday!' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);

      await cleanup(basketId);
    });

    it('should remove gift wrapping from item', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const addResp = await addItem(basketId, TEST_PRODUCT_1_ID, 1, 29.99);
      const addData = addResp?.data as Record<string, unknown> | undefined;
      const items = addData?.items as Array<Record<string, unknown>> | undefined;
      const itemId = items?.[0]?.basketItemId as string | undefined;
      if (!itemId) return;

      await client.post(
        `/customer/basket/${basketId}/items/${itemId}/gift`,
        { isGift: true, giftMessage: 'Happy Birthday!' },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      const response = await client.post(
        `/customer/basket/${basketId}/items/${itemId}/gift`,
        { isGift: false },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 200);
      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Basket Expiration Tests
  // ============================================================================

  describe('Basket Expiration', () => {
    it('should extend basket expiration', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.put(
        `/customer/basket/${basketId}/expiration`,
        { days: 7 },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);

      await cleanup(basketId);
    });

    it('should reject negative expiration extension', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.put(
        `/customer/basket/${basketId}/expiration`,
        { days: -1 },
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 400);
      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Clear Basket Tests
  // ============================================================================

  describe('Clear Basket', () => {
    it('should clear all items from basket', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      await addItem(basketId, TEST_PRODUCT_1_ID, 2, 29.99);
      await addItem(basketId, TEST_PRODUCT_2_ID, 1, 15.5);

      const response = await client.delete(`/customer/basket/${basketId}/items`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const getResp = await client.get(`/customer/basket/${basketId}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
      if (getResp.status === 200) {
        expect(getResp.data.data.itemCount).toBe(0);
      }

      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Item Removal Tests
  // ============================================================================

  describe('Item Removal', () => {
    it('should remove a specific item from basket', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const addResp = await addItem(basketId, TEST_PRODUCT_1_ID, 2, 29.99);
      const addData = addResp?.data as Record<string, unknown> | undefined;
      const items = addData?.items as Array<Record<string, unknown>> | undefined;
      const itemId = items?.[0]?.basketItemId as string | undefined;
      if (!itemId) return;

      const response = await client.delete(
        `/customer/basket/${basketId}/items/${itemId}`,
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      await cleanup(basketId);
    });

    it('should return 404 for removing non-existent item', async () => {
      const basketId = await createBasket();
      if (!basketId) return;

      const response = await client.delete(
        `/customer/basket/${basketId}/items/00000000-0000-0000-0000-000000000000`,
        { headers: { Authorization: `Bearer ${customerToken}` } },
      );

      expectStatus(response, 404);
      await cleanup(basketId);
    });
  });
});
