/**
 * Coupon Business API Integration Tests
 *
 * Tests for the coupon management endpoints (business side):
 * - GET    /business/coupons              — list coupons
 * - POST   /business/coupons              — create coupon
 * - POST   /business/coupons/validate     — validate coupon
 * - GET    /business/coupons/validate/:code — validate coupon by code
 * - POST   /business/coupons/apply        — apply coupon
 * - POST   /business/coupons/redeem       — redeem coupon
 * - GET    /business/coupons/:couponId    — get coupon by ID
 * - DELETE /business/coupons/:couponId    — delete coupon
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { randomUUID } from 'node:crypto';

describe('Coupon Business API', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let createdCouponId: string | undefined;

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  afterAll(async () => {
    if (createdCouponId && adminToken) {
      await client.delete(`/business/coupons/${createdCouponId}`, {
        headers: authHeaders(),
      });
    }
  });

  describe('POST /business/coupons', () => {
    it('should create a percentage coupon successfully', async () => {
      if (!adminToken) return;

      const couponData = {
        code: `TEST-${Date.now()}`,
        name: 'Test Percentage Coupon',
        type: 'percentage' as const,
        value: 10,
        createdBy: '00000000-0000-0000-0000-000000000001',
        description: '10% off test coupon',
        usageType: 'multi_use' as const,
        usageLimit: 100,
      };

      const response = await client.post('/business/coupons', couponData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();

      if (response.status === 201) {
        createdCouponId = response.data.data?.couponId || response.data.data?.id;
      }
    });

    it('should create a fixed amount coupon successfully', async () => {
      if (!adminToken) return;

      const couponData = {
        code: `FIXED-${Date.now()}`,
        name: 'Test Fixed Coupon',
        type: 'fixed_amount' as const,
        value: 5.0,
        createdBy: '00000000-0000-0000-0000-000000000001',
        currency: 'USD',
        usageType: 'single_use' as const,
      };

      const response = await client.post('/business/coupons', couponData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
    });

    it('should reject coupon creation with missing code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons',
        {
          name: 'Missing Code Coupon',
          type: 'percentage',
          value: 10,
          createdBy: '00000000-0000-0000-0000-000000000001',
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });

    it('should reject coupon creation with missing name', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons',
        {
          code: `NONAME-${Date.now()}`,
          type: 'percentage',
          value: 10,
          createdBy: '00000000-0000-0000-0000-000000000001',
        },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });
  });

  describe('GET /business/coupons', () => {
    it('should list coupons with default pagination', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/coupons', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should filter coupons by active status', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/coupons', {
        headers: authHeaders(),
        params: { isActive: 'true' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should support pagination with limit', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/coupons', {
        headers: authHeaders(),
        params: { limit: 5, offset: 0 },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('GET /business/coupons/:couponId', () => {
    it('should return 404 for non-existent coupon', async () => {
      if (!adminToken) return;

      const response = await client.get(`/business/coupons/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 404);
    });

    it('should reject invalid UUID format', async () => {
      if (!adminToken) return;

      const response = await client.get('/business/coupons/not-a-uuid', {
        headers: authHeaders(),
      });

      expectStatus(response, 400);
    });

    it('should get a coupon by ID if created', async () => {
      if (!adminToken || !createdCouponId) return;

      const response = await client.get(`/business/coupons/${createdCouponId}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  describe('POST /business/coupons/validate', () => {
    it('should reject validation with missing order value', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        { code: 'INVALID-CODE' },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });

    it('should reject validation with non-existent coupon code', async () => {
      if (!adminToken) return;

      const response = await client.post(
        '/business/coupons/validate',
        { code: 'NON-EXISTENT-CODE-12345', orderValue: 100 },
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });
  });

  describe('GET /business/coupons/validate/:code', () => {
    it('should reject validation with non-existent code', async () => {
      if (!adminToken) return;

      const response = await client.get(
        '/business/coupons/validate/NON-EXISTENT-CODE-12345',
        { headers: authHeaders() },
      );

      expectStatus(response, 400);
    });
  });

  describe('DELETE /business/coupons/:couponId', () => {
    it('should return error for non-existent coupon', async () => {
      if (!adminToken) return;

      const response = await client.delete(`/business/coupons/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expect([400, 404].includes(response.status)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should reject requests without auth token', async () => {
      const response = await client.get('/business/coupons');

      expectStatus(response, 401);
    });
  });
});
