import { AxiosInstance } from 'axios';
import { SEEDED_PROMOTION_ID, SEEDED_CART_ID } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Cart Promotion Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let cartPromotionId: string;
  let promotionId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    testCartId = SEEDED_CART_ID;
    promotionId = SEEDED_PROMOTION_ID;
  });

  it('should apply a cart promotion', async () => {
    if (!adminToken || !testCartId || !promotionId) {
      return;
    }

    const cartPromotionData = {
      basketId: testCartId,
      promotionId: promotionId,
      discountAmountCents: 1000,
      status: 'active',
    };

    const response = await client.post('/business/cart-promotions', cartPromotionData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('cartPromotionId');

    cartPromotionId = response.data.data.cartPromotionId;
  });

  it('should get cart promotions by cart ID', async () => {
    if (!adminToken || !testCartId) {
      return;
    }

    const response = await client.get(`/business/cart-promotions/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);

    if (cartPromotionId && response.data.data.length > 0) {
      const foundPromotion = response.data.data.find((p: Record<string, unknown>) => p.cartPromotionId === cartPromotionId);
      if (foundPromotion) {
        expect(foundPromotion.basketId).toBe(testCartId);
        expect(foundPromotion.promotionId).toBe(promotionId);
      }
    }
  });

  it('should remove a promotion from a cart', async () => {
    if (!adminToken || !cartPromotionId) {
      return;
    }

    const response = await client.delete(`/business/cart-promotions/${cartPromotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify the promotion is removed
    const getResponse = await client.get(`/business/cart-promotions/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (getResponse.status === 200 && getResponse.data?.data) {
      const foundPromotion = getResponse.data.data.find((p: Record<string, unknown>) => p.cartPromotionId === cartPromotionId);
      expect(foundPromotion).toBeUndefined();
    }
  });

});
