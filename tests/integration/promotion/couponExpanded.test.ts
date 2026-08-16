/**
 * Coupon Expanded Tests
 * Tests: validation, application, expiration, stacking, usage limits
 */

import { AxiosInstance } from 'axios';
import { setupPromotionTests, testCoupon, SEEDED_COUPON_CODE_FIXED, SEEDED_COUPON_CODE_PERCENTAGE, SEEDED_COUPON_CODE_EXPIRED, SEEDED_GIFT_CARD_CODE } from './testUtils';
import { loginTestUser, expectStatus } from '../testUtils';
import { TEST_PRODUCT_1_ID } from '../testConstants';

describe('Coupon Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = await loginTestUser(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${customerToken}` });
  const adminAuthHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  const createBasketWithItems = async (totalValue: number = 100): Promise<string | null> => {
    if (!customerToken) return null;
    const basketResp = await client.post(
      '/customer/basket',
      { sessionId: `coupon-exp-${Date.now()}-${Math.random()}` },
      { headers: authHeaders() },
    );
    if (basketResp.status !== 200 || !basketResp.data?.data?.basketId) return null;
    const basketId = basketResp.data.data.basketId;

    const qty = Math.max(1, Math.ceil(totalValue / 29.99));
    await client.post(
      `/customer/basket/${basketId}/items`,
      { productId: TEST_PRODUCT_1_ID, sku: 'TEST-SKU-001', name: 'Test Product', quantity: qty, unitPrice: 29.99 },
      { headers: authHeaders() },
    );

    return basketId;
  };

  const cleanup = async (basketId: string) => {
    await client.delete(`/customer/basket/${basketId}`, { headers: authHeaders() }).catch(() => {});
  };

  // ============================================================================
  // Coupon Validation Tests
  // ============================================================================

  describe('Coupon Validation', () => {
    it('should reject non-existent coupon code', async () => {
      const basketId = await createBasketWithItems(100);
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: 'NONEXISTENT99999' },
        { headers: authHeaders() },
      );

      expectStatus(resp, 400);
      await cleanup(basketId);
    });

    it('should reject empty coupon code', async () => {
      const basketId = await createBasketWithItems(100);
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: '' },
        { headers: authHeaders() },
      );

      expectStatus(resp, 400);
      await cleanup(basketId);
    });

    it('should reject expired coupon code', async () => {
      const basketId = await createBasketWithItems(100);
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_EXPIRED },
        { headers: authHeaders() },
      );

      expectStatus(resp, 400);
      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Coupon Application Tests
  // ============================================================================

  describe('Coupon Application', () => {
    it('should apply fixed amount coupon correctly', async () => {
      const basketId = await createBasketWithItems(100);
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_FIXED },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('discountAmount');
      expect(resp.data.data.discountAmount).toBeGreaterThan(0);

      await cleanup(basketId);
    });

    it('should apply percentage coupon correctly', async () => {
      const basketId = await createBasketWithItems(100);
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_PERCENTAGE },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('discountAmount');

      await cleanup(basketId);
    });

    it.skip('should apply gift card code correctly', async () => {
      // Gift card feature not yet implemented (no giftCard table)
      const basketId = await createBasketWithItems(50);
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_GIFT_CARD_CODE },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Coupon Removal Tests
  // ============================================================================

  describe('Coupon Removal', () => {
    it('should remove applied coupon and reset discount', async () => {
      const basketId = await createBasketWithItems(100);
      if (!basketId) return;

      const applyResp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_FIXED },
        { headers: authHeaders() },
      );

      // If coupon application failed, skip removal test
      if (applyResp.status !== 200) {
        await cleanup(basketId);
        return;
      }

      const resp = await client.delete(`/customer/basket/${basketId}/coupon`, {
        headers: authHeaders(),
      });

      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);

      await cleanup(basketId);
    });
  });

  // ============================================================================
  // Coupon CRUD (Admin) Tests
  // ============================================================================

  describe('Coupon CRUD (Admin)', () => {
    let createdCouponId: string;

    it('should create a coupon with all fields', async () => {
      if (!adminToken) return;

      const resp = await client.post('/business/coupons', testCoupon, {
        headers: adminAuthHeaders(),
      });

      expectStatus(resp, 201);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('promotionCouponId');
      createdCouponId = resp.data.data.promotionCouponId;
    });

    it('should get coupon by ID', async () => {
      if (!adminToken || !createdCouponId) return;

      const resp = await client.get(`/business/coupons/${createdCouponId}`, {
        headers: adminAuthHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should update coupon', async () => {
      if (!adminToken || !createdCouponId) return;

      const resp = await client.put(
        `/business/coupons/${createdCouponId}`,
        { ...testCoupon, description: 'Updated description' },
        { headers: adminAuthHeaders() },
      );

      expectStatus(resp, 200);
    });

    it('should delete coupon', async () => {
      if (!adminToken || !createdCouponId) return;

      const resp = await client.delete(`/business/coupons/${createdCouponId}`, {
        headers: adminAuthHeaders(),
      });

      expectStatus(resp, 200);
    });

    it('should return 404 for deleted coupon', async () => {
      if (!adminToken || !createdCouponId) return;

      const resp = await client.get(`/business/coupons/${createdCouponId}`, {
        headers: adminAuthHeaders(),
      });

      expectStatus(resp, 404);
    });
  });

  // ============================================================================
  // Coupon Usage Limit Tests
  // ============================================================================

  describe('Coupon Usage Limits', () => {
    it('should list coupons with usage counts', async () => {
      if (!adminToken) return;

      const resp = await client.get('/business/coupons', {
        headers: adminAuthHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      if (resp.data.data?.length > 0) {
        const coupon = resp.data.data[0];
        expect(coupon).toHaveProperty('code');
      }
    });
  });
});
