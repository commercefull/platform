/**
 * Coupon Apply/Redeem Integration Tests
 *
 * Covers endpoints not exercised by coupon.test.ts / couponExpanded.test.ts:
 * - POST /business/coupons/apply
 * - POST /business/coupons/redeem
 * - POST /customer/coupons/apply
 */

import { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { SEEDED_COUPON_CODE_PERCENTAGE, SEEDED_COUPON_CODE_FIXED } from './testUtils';

describe('Coupon Apply/Redeem Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const headers = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    if (!adminToken) throw new Error('Failed to get admin token for Coupon tests');
  });

  describe('POST /business/coupons/apply', () => {
    it('applies a valid percentage coupon', async () => {
      const resp = await client.post(
        '/business/coupons/apply',
        { code: SEEDED_COUPON_CODE_PERCENTAGE, basketId: randomUUID(), orderTotalCents: 10000 },
        { headers: headers() },
      );
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data.applied).toBe(true);
      expect(resp.data.data.discountAmountCents).toBeGreaterThan(0);
    });

    it('returns applied=false for an unknown coupon code', async () => {
      const resp = await client.post(
        '/business/coupons/apply',
        { code: 'NO-SUCH-CODE', basketId: randomUUID(), orderTotalCents: 10000 },
        { headers: headers() },
      );
      expectStatus(resp, 200);
      expect(resp.data.data.applied).toBe(false);
    });
  });

  describe('POST /customer/coupons/apply', () => {
    it('applies a coupon via the public customer route', async () => {
      const resp = await client.post('/customer/coupons/apply', {
        code: SEEDED_COUPON_CODE_FIXED,
        basketId: randomUUID(),
        orderTotalCents: 5000,
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });
  });

  describe('POST /business/coupons/redeem', () => {
    it('redeems a coupon for an order', async () => {
      const resp = await client.post(
        '/business/coupons/redeem',
        { code: SEEDED_COUPON_CODE_FIXED, orderId: '00000000-0000-0000-0000-000000000200', discountAmountCents: 1000 },
        { headers: headers() },
      );
      expectStatus(resp, 200);
      expect(resp.data.data.redeemed).toBe(true);
    });

    it('returns 404 for an unknown coupon code', async () => {
      const resp = await client.post(
        '/business/coupons/redeem',
        { code: 'NO-SUCH-CODE', orderId: randomUUID(), discountAmountCents: 1000 },
        { headers: headers() },
      );
      expectStatus(resp, 404);
    });
  });
});
