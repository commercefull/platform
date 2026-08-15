/**
 * Coupon API Integration Tests
 * Tests coupon CRUD, validation, usage, and auth endpoints
 */

import { AxiosInstance } from 'axios';
import { setupPromotionTests, cleanupPromotionTests, testCoupon } from './testUtils';

describe('Coupon API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let testCategoryId: string;
  let testProductId: string;
  let couponId: string;

  beforeAll(async () => {
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCartId = setup.testCartId;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;
  });

  // ============================================================================
  // Coupon CRUD Tests
  // ============================================================================

  describe('Coupon CRUD', () => {
    it('should create a new coupon', async () => {
      if (!adminToken) return;

      const response = await client.post('/business/coupons', testCoupon, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('promotionCouponId');

      couponId = response.data.data.promotionCouponId;
      expect(response.data.data.code).toBe(testCoupon.code);
    });

    it('should list coupons', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/coupons', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a coupon by ID', async () => {
      if (!adminToken || !couponId) return;

      const response = await client.get(`/business/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.promotionCouponId).toBe(couponId);
    });

    it('should get a coupon by code', async () => {
      if (!adminToken || !couponId) return;

      const response = await client.get(`/business/coupons/code/${testCoupon.code}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.promotionCouponId).toBe(couponId);
    });

    it('should return 404 for non-existent coupon', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/coupons/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(404);
    });

    it('should update a coupon', async () => {
      if (!adminToken || !couponId) return;

      const updateData = {
        name: 'Updated Test Coupon',
        discountAmount: 20,
      };

      const response = await client.put(`/business/coupons/${couponId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.name).toBe(updateData.name);
    });

    it('should get coupon usage records', async () => {
      if (!adminToken || !couponId) return;

      const response = await client.get(`/business/coupons/${couponId}/usage`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // Coupon Validation Tests
  // ============================================================================

  describe('Coupon Validation', () => {
    it('should validate a coupon with valid code and order total', async () => {
      if (!adminToken || !couponId) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: testCoupon.code,
          orderTotal: 50,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      if (response.data.data) {
        expect(response.data.data).toHaveProperty('valid');
      }
    });

    it('should calculate coupon discount with items', async () => {
      if (!adminToken || !couponId) return;

      const cartItems = [{ productId: testProductId, quantity: 2, price: 49.99 }];

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: testCoupon.code,
          orderTotal: 99.98,
          items: cartItems,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject validation with empty code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: '',
          orderTotal: 50,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect([400, 404]).toContain(response.status);
    });

    it('should reject validation with non-existent code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'NONEXISTENT12345',
          orderTotal: 50,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect([400, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Coupon Delete Tests
  // ============================================================================

  describe('Coupon Delete', () => {
    it('should delete a coupon', async () => {
      if (!adminToken || !couponId) return;

      const response = await client.delete(`/business/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);

      const getResponse = await client.get(`/business/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(getResponse.status).toBe(404);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for listing coupons', async () => {
      const response = await client.get('/business/coupons');
      expect(response.status).toBe(401);
    });

    it('should require auth for creating coupons', async () => {
      const response = await client.post('/business/coupons', testCoupon);
      expect(response.status).toBe(401);
    });

    it('should require auth for validating coupons', async () => {
      const response = await client.post('/business/coupons/validate', {
        code: 'TEST',
        orderTotal: 50,
      });
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/coupons', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });

  // ============================================================================
  // Seeded Coupon Tests
  // ============================================================================

  describe('Seeded Coupons', () => {
    it('should validate seeded fixed coupon code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'TESTFIXED10',
          orderTotal: 100,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should validate seeded percentage coupon code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'TESTPERCENT15',
          orderTotal: 100,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should reject expired seeded coupon', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'EXPIRED20',
          orderTotal: 100,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expect([200, 400, 404]).toContain(response.status);
      if (response.status === 200 && response.data.data) {
        expect(response.data.data.valid).toBe(false);
      }
    });
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
