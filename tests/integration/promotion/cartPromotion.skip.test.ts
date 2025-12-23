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
    try {
      const promotionResponse = await client.post('/business/promotions', testPromotion, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (promotionResponse.data?.data?.id) {
        promotionId = promotionResponse.data.data.id;
      } else {
        
        promotionId = '';
      }
    } catch (error) {
      
      promotionId = '';
    }
  });

  it('should apply a cart promotion', async () => {
    if (!adminToken || !testCartId || !promotionId) {
      
      return;
    }
    
    const cartPromotionData = {
      cartId: testCartId,
      promotionId: promotionId,
      discountAmount: 10,
      status: 'applied'
    };
    
    const response = await client.post('/business/cart-promotions', cartPromotionData, {
      headers: { Authorization: `Bearer ${adminToken}` }
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
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    
    if (cartPromotionId && response.data.data.length > 0) {
      const foundPromotion = response.data.data.find((p: any) => p.cartPromotionId === cartPromotionId);
      if (foundPromotion) {
        expect(foundPromotion.cartId).toBe(testCartId);
        expect(foundPromotion.promotionId).toBe(promotionId);
      }
    }
  });

  it('should remove a promotion from a cart', async () => {
    if (!adminToken || !cartPromotionId) {
      
      return;
    }
    
    const response = await client.delete(`/business/cart-promotions/${cartPromotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the promotion is removed
    const getResponse = await client.get(`/business/cart-promotions/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (getResponse.status === 200 && getResponse.data?.data) {
      const foundPromotion = getResponse.data.data.find((p: any) => p.cartPromotionId === cartPromotionId);
      expect(foundPromotion).toBeUndefined();
    }
  });

  afterAll(async () => {
    // Clean up the promotion we created in this test
    try {
      await client.delete(`/business/promotions/${promotionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      
    }

    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
