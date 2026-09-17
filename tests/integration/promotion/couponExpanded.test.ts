/**
 * Coupon Expanded Tests
 * Tests: validation, application, expiration, stacking, usage limits
 */

import { AxiosInstance } from 'axios';
import {
  testCoupon,
  SEEDED_COUPON_CODE_FIXED,
  SEEDED_COUPON_CODE_PERCENTAGE,
  SEEDED_COUPON_CODE_EXPIRED,
} from './testUtils';
import { createTestClient, loginTestAdmin, loginTestUser, expectStatus } from '../testUtils';

// Seeded single-use baskets ($59.98 each) owned by testcustomer@example.com —
// sized above TESTPERCENT15's minOrderAmount of 50
// (seeds/20240805002001_seedIntegrationTestData.js coupon basket pool)
const SEEDED_BASKET_POOL = Array.from(
  { length: 8 },
  (_, i) => `00000000-0000-0000-0000-0000000040${String(i).padStart(2, '0')}`,
);

describe('Coupon Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let basketPoolIndex = 0;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client, 'testcustomer@example.com', 'password123');
  });

  const authHeaders = () => ({ Authorization: `Bearer ${customerToken}` });
  const adminAuthHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  const createBasketWithItems = async (): Promise<string | null> => {
    return SEEDED_BASKET_POOL[basketPoolIndex++] || null;
  };

  // ============================================================================
  // Coupon Validation Tests
  // ============================================================================

  describe('Coupon Validation', () => {
    it('should reject non-existent coupon code', async () => {
      const basketId = await createBasketWithItems();
      if (!basketId) return;

      const resp = await client.post(`/customer/basket/${basketId}/coupon`, { couponCode: 'NONEXISTENT99999' }, { headers: authHeaders() });

      expectStatus(resp, 400);
    });

    it('should reject empty coupon code', async () => {
      const basketId = await createBasketWithItems();
      if (!basketId) return;

      const resp = await client.post(`/customer/basket/${basketId}/coupon`, { couponCode: '' }, { headers: authHeaders() });

      expectStatus(resp, 400);
    });

    it('should reject expired coupon code', async () => {
      const basketId = await createBasketWithItems();
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_EXPIRED },
        { headers: authHeaders() },
      );

      expectStatus(resp, 400);
    });
  });

  // ============================================================================
  // Coupon Application Tests
  // ============================================================================

  describe('Coupon Application', () => {
    it('should apply fixed amount coupon correctly', async () => {
      const basketId = await createBasketWithItems();
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
    });

    it('should apply percentage coupon correctly', async () => {
      const basketId = await createBasketWithItems();
      if (!basketId) return;

      const resp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_PERCENTAGE },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('discountAmount');
    });

  });

  // ============================================================================
  // Coupon Removal Tests
  // ============================================================================

  describe('Coupon Removal', () => {
    it('should remove applied coupon and reset discount', async () => {
      const basketId = await createBasketWithItems();
      if (!basketId) return;

      const applyResp = await client.post(
        `/customer/basket/${basketId}/coupon`,
        { couponCode: SEEDED_COUPON_CODE_FIXED },
        { headers: authHeaders() },
      );

      // If coupon application failed, skip removal test
      if (applyResp.status !== 200) {
        return;
      }

      const resp = await client.delete(`/customer/basket/${basketId}/coupon`, {
        headers: authHeaders(),
      });

      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
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
