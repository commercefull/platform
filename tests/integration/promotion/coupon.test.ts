/**
 * Coupon API Integration Tests
 * Tests coupon CRUD, validation, usage, and auth endpoints
 */

import { AxiosInstance } from 'axios';
import { testCoupon, SEEDED_PRODUCT_ID } from './testUtils';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

describe('Coupon API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;
  let couponId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    testProductId = SEEDED_PRODUCT_ID;
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
        discountAmountCents: 2000,
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

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
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
          orderTotalCents: 5000,
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
          orderTotalCents: 9998,
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
          orderTotalCents: 5000,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expectStatus(response, 400);
    });

    it('should reject validation with non-existent code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'NONEXISTENT12345',
          orderTotalCents: 5000,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expectStatus(response, 400);
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
        orderTotalCents: 5000,
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
          orderTotalCents: 10000,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should validate seeded percentage coupon code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'TESTPERCENT15',
          orderTotalCents: 10000,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should reject expired seeded coupon', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        {
          code: 'EXPIRED20',
          orderTotalCents: 10000,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );

      expectStatus(response, 400);
      if (response.data.data) {
        expect(response.data.data.valid).toBe(false);
      }
    });
  });

});
