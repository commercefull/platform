import { AxiosInstance } from 'axios';
import { setupPromotionTests, cleanupPromotionTests, testPromotion } from './testUtils';

describe('Category Promotion Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let testCategoryId: string;
  let testProductId: string;
  let categoryPromotionId: string;
  let promotionId: string;

  beforeAll(async () => {
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCartId = setup.testCartId;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;

    // Create a new promotion to apply to category
    const promotionResponse = await client.post('/business/promotions', testPromotion, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    promotionId = promotionResponse.data.data.id;
  });

  it('should create a category promotion', async () => {
    const categoryPromotionData = {
      categoryId: testCategoryId,
      promotionId: promotionId,
      discountPercentage: 10,
      minPurchaseAmount: 50,
      maxDiscountAmount: 100,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + 86400000).toISOString(),
      status: 'active'
    };
    
    const response = await client.post('/business/category-promotions', categoryPromotionData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('categoryPromotionId');
    
    categoryPromotionId = response.data.data.categoryPromotionId;
  });

  it('should get promotions by category ID', async () => {
    const response = await client.get(`/business/category-promotions/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
    
    const foundPromotion = response.data.data.find((p: any) => p.categoryPromotionId === categoryPromotionId);
    expect(foundPromotion).toBeDefined();
    expect(foundPromotion.categoryId).toBe(testCategoryId);
    expect(foundPromotion.promotionId).toBe(promotionId);
  });

  it('should get active category promotions', async () => {
    const response = await client.get('/business/category-promotions', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    
    const foundPromotion = response.data.data.find((p: any) => p.categoryPromotionId === categoryPromotionId);
    expect(foundPromotion).toBeDefined();
  });

  it('should delete a category promotion', async () => {
    const response = await client.delete(`/business/category-promotions/${categoryPromotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the category promotion is deleted
    const getResponse = await client.get(`/business/category-promotions/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    const foundPromotion = getResponse.data.data.find((p: any) => p.categoryPromotionId === categoryPromotionId);
    expect(foundPromotion).toBeUndefined();
  });

  afterAll(async () => {
    // Clean up the promotion we created in this test
    try {
      await client.delete(`/business/promotions/${promotionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      console.error('Error cleaning up promotion:', error);
    }

    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
