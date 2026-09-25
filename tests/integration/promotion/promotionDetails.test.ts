/**
 * Promotion Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by the existing promotion suites:
 * - GET /business/promotions + /business/promotions/active
 * - GET/PUT /business/cart-promotions/:id
 * - GET/PUT /business/category-promotions/:id
 * - POST /business/gift-cards/:id/assign + /:id/refund
 * - POST /business/coupons/calculate
 *
 * Fixtures from seeds/20240805001500_seedPromotionTestData.js.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';
import { TEST_CUSTOMER_ID } from '../testConstants';
import {
  SEEDED_PROMOTION_ID,
  SEEDED_CATEGORY_PROMOTION_ID,
  SEEDED_CART_ID,
  SEEDED_COUPON_CODE_FIXED,
  testPromotion,
} from './testUtils';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Promotion Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Promotion lists', () => {
    it('GET /business/promotions lists promotions including the seeded one', async () => {
      const resp = await client.get('/business/promotions', auth());
      expectStatus(resp, 200);
      const rows = resp.data.data;
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.some((p: { promotionId: string }) => p.promotionId === SEEDED_PROMOTION_ID)).toBe(true);
    });

    it('GET /business/promotions/active lists active promotions', async () => {
      const resp = await client.get('/business/promotions/active', auth());
      expectStatus(resp, 200);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });
  });

  describe('Cart promotions', () => {
    let cartPromotionId: string;

    it('POST /business/cart-promotions applies a promotion to the seeded basket', async () => {
      const promo = await client.post('/business/promotions', testPromotion, auth());
      expectStatus(promo, 201);
      const promotionId = promo.data.data.promotionId;

      const resp = await client.post(
        '/business/cart-promotions',
        { basketId: SEEDED_CART_ID, promotionId, discountAmountCents: 1000, status: 'active' },
        auth(),
      );
      expectStatus(resp, 201);
      cartPromotionId = resp.data.data.cartPromotionId;
      expect(cartPromotionId).toBeTruthy();
    });

    it('GET /business/cart-promotions/:id returns the applied promotion', async () => {
      const resp = await client.get(`/business/cart-promotions/${cartPromotionId}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.cartPromotionId).toBe(cartPromotionId);
      expect(resp.data.data.basketId).toBe(SEEDED_CART_ID);
    });

    it('GET /business/cart-promotions/:id returns 404 for unknown id', async () => {
      const resp = await client.get(`/business/cart-promotions/${UNKNOWN_ID}`, auth());
      expectStatus(resp, 404);
    });

    it('PUT /business/cart-promotions/:id updates the discount amount', async () => {
      const resp = await client.put(
        `/business/cart-promotions/${cartPromotionId}`,
        { discountAmountCents: 1500 },
        auth(),
      );
      expectStatus(resp, 200);
      expect(Number(resp.data.data.discountAmountCents)).toBe(1500);
    });
  });

  describe('Category promotions', () => {
    it('GET /business/category-promotions/:id returns the seeded row', async () => {
      const resp = await client.get(`/business/category-promotions/${SEEDED_CATEGORY_PROMOTION_ID}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.categoryPromotionId).toBe(SEEDED_CATEGORY_PROMOTION_ID);
    });

    it('GET /business/category-promotions/:id returns 404 for unknown id', async () => {
      const resp = await client.get(`/business/category-promotions/${UNKNOWN_ID}`, auth());
      expectStatus(resp, 404);
    });

    it('PUT /business/category-promotions/:id updates the banner text', async () => {
      const resp = await client.put(
        `/business/category-promotions/${SEEDED_CATEGORY_PROMOTION_ID}`,
        { bannerText: 'Updated Banner' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.bannerText).toBe('Updated Banner');
    });
  });

  describe('Gift card assign/refund', () => {
    let giftCardId: string;

    it('POST /business/gift-cards creates a card', async () => {
      const resp = await client.post('/business/gift-cards', { initialBalanceCents: 5000 }, auth());
      expectStatus(resp, 201);
      giftCardId = resp.data.data.promotionGiftCardId;
      expect(giftCardId).toBeTruthy();
    });

    it('POST /business/gift-cards/:id/assign requires customerId', async () => {
      const resp = await client.post(`/business/gift-cards/${giftCardId}/assign`, {}, auth());
      expectStatus(resp, 400);
    });

    it('POST /business/gift-cards/:id/assign assigns the card to a customer', async () => {
      const resp = await client.post(
        `/business/gift-cards/${giftCardId}/assign`,
        { customerId: TEST_CUSTOMER_ID },
        auth(),
      );
      expectStatus(resp, 200);

      const detail = await client.get(`/business/gift-cards/${giftCardId}`, auth());
      expectStatus(detail, 200);
      expect(detail.data.data.assignedTo).toBe(TEST_CUSTOMER_ID);
    });

    it('POST /business/gift-cards/:id/refund records a refund transaction', async () => {
      const activate = await client.post(`/business/gift-cards/${giftCardId}/activate`, {}, auth());
      expectStatus(activate, 200);

      const resp = await client.post(
        `/business/gift-cards/${giftCardId}/refund`,
        { amountCents: 700, notes: 'Coverage refund' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data).toBeTruthy();

      const detail = await client.get(`/business/gift-cards/${giftCardId}`, auth());
      const txns = detail.data.data.transactions;
      expect(txns.some((t: { type: string }) => t.type === 'refund')).toBe(true);
    });
  });

  describe('Coupon calculate', () => {
    it('POST /business/coupons/calculate returns the discount math', async () => {
      const resp = await client.post(
        '/business/coupons/calculate',
        { code: SEEDED_COUPON_CODE_FIXED, orderTotalCents: 5000 },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.discountAmountCents).toBe(1000);
      expect(resp.data.data.finalTotalCents).toBe(4000);
    });

    it('POST /business/coupons/calculate rejects a missing order total', async () => {
      const resp = await client.post('/business/coupons/calculate', { code: SEEDED_COUPON_CODE_FIXED }, auth());
      expectStatus(resp, 400);
    });

    it('POST /business/coupons/calculate returns 404 for an unknown code', async () => {
      const resp = await client.post(
        '/business/coupons/calculate',
        { code: 'NO-SUCH-CODE', orderTotalCents: 5000 },
        auth(),
      );
      expectStatus(resp, 404);
    });
  });
});
