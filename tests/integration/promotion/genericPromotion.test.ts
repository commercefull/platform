import { AxiosInstance } from 'axios';
import { testPromotion, SEEDED_CART_ID } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Generic Promotion API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let promotionId: string;
  let cartPromotionId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    testCartId = SEEDED_CART_ID;
  });

  it('should create a new promotion', async () => {
    if (!adminToken) {
      return;
    }

    const response = await client.post('/business/promotions', testPromotion, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    // API returns promotionId, not id
    expect(response.data.data).toHaveProperty('promotionId');

    // Save the promotion ID for later tests
    promotionId = response.data.data.promotionId;

    // Validate the promotion data
    expect(response.data.data.name).toBe(testPromotion.name);
  });

  it('should get a promotion by ID', async () => {
    if (!adminToken || !promotionId) {
      return;
    }

    const response = await client.get(`/business/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    // Single get returns { promotion, rules, actions } structure
    if (response.data.data.promotion) {
      expect(response.data.data.promotion.promotionId).toBe(promotionId);
    } else if (response.data.data.promotionId) {
      expect(response.data.data.promotionId).toBe(promotionId);
    }
  });

  it('should update a promotion', async () => {
    if (!adminToken || !promotionId) {
      return;
    }

    const updateData = {
      name: 'Updated Test Promotion',
      discountValue: 15,
    };

    const response = await client.put(`/business/promotions/${promotionId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
  });

  it('should apply a promotion to a cart', async () => {
    if (!adminToken || !promotionId || !testCartId) {
      return;
    }

    // Apply the promotion to the seeded cart
    const response = await client.post(
      '/business/cart-promotions',
      {
        basketId: testCartId,
        promotionId: promotionId,
        discountAmountCents: 1000,
        currencyCode: 'USD',
        status: 'active',
        isAutoApplied: false,
        isCustomerInitiated: true,
      },
      {
        headers: { Authorization: `Bearer ${adminToken}` },
      },
    );

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    cartPromotionId = response.data.data.cartPromotionId;
  });

  it('should list promotions applied to a cart', async () => {
    if (!adminToken || !promotionId || !testCartId) {
      return;
    }

    const response = await client.get(`/business/cart-promotions/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    const applied = Array.isArray(response.data.data) ? response.data.data : [];
    expect(applied.some((p: Record<string, unknown>) => p.promotionId === promotionId)).toBe(true);
  });

  it('should delete a promotion', async () => {
    // Remove the cart link created above first (promotionCart FK references the promotion)
    if (cartPromotionId) {
      const unlinkResp = await client.delete(`/business/cart-promotions/${cartPromotionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(unlinkResp.status).toBe(200);
    }

    const response = await client.delete(`/business/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify the promotion is deleted
    const getResponse = await client.get(`/business/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(getResponse.status).toBe(404);
  });

});
