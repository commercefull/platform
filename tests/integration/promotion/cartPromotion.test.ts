import { AxiosInstance } from 'axios';
import { setupPromotionTests, cleanupPromotionTests, testPromotion } from './testUtils';

describe('Cart Promotion Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let testCategoryId: string;
  let testProductId: string;
  let cartPromotionId: string;
  let promotionId: string;

  beforeAll(async () => {
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCartId = setup.testCartId;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;

    // Create a new promotion to apply to cart
    const promotionResponse = await client.post('/api/admin/promotions', testPromotion, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    promotionId = promotionResponse.data.data.id;
  });

  it('should apply a cart promotion', async () => {
    const cartPromotionData = {
      cartId: testCartId,
      promotionId: promotionId,
      discountAmount: 10,
      status: 'applied'
    };
    
    const response = await client.post('/api/admin/cart-promotions', cartPromotionData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('cartPromotionId');
    
    cartPromotionId = response.data.data.cartPromotionId;
  });

  it('should get cart promotions by cart ID', async () => {
    const response = await client.get(`/api/admin/cart-promotions/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
    
    const foundPromotion = response.data.data.find((p: any) => p.cartPromotionId === cartPromotionId);
    expect(foundPromotion).toBeDefined();
    expect(foundPromotion.cartId).toBe(testCartId);
    expect(foundPromotion.promotionId).toBe(promotionId);
  });

  it('should remove a promotion from a cart', async () => {
    const response = await client.delete(`/api/admin/cart-promotions/${cartPromotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the promotion is removed
    const getResponse = await client.get(`/api/admin/cart-promotions/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const foundPromotion = getResponse.data.data.find((p: any) => p.cartPromotionId === cartPromotionId);
    expect(foundPromotion).toBeUndefined();
  });

  afterAll(async () => {
    // Clean up the promotion we created in this test
    try {
      await client.delete(`/api/admin/promotions/${promotionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      console.error('Error cleaning up promotion:', error);
    }

    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
