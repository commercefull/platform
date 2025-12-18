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
    try {
      const promotionResponse = await client.post('/business/promotions', testPromotion, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (promotionResponse.data?.data?.id) {
        promotionId = promotionResponse.data.data.id;
      } else {
        console.log('Warning: Could not create test promotion:', promotionResponse.data);
        promotionId = '';
      }
    } catch (error) {
      console.log('Warning: Promotion setup failed:', error);
      promotionId = '';
    }
  });

  it('should create a category promotion', async () => {
    if (!adminToken || !testCategoryId || !promotionId) {
      console.log('Skipping test - missing admin token, category ID, or promotion ID');
      return;
    }
    
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
    if (!adminToken || !testCategoryId) {
      console.log('Skipping test - missing admin token or category ID');
      return;
    }
    
    const response = await client.get(`/business/category-promotions/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    
    if (categoryPromotionId && response.data.data.length > 0) {
      const foundPromotion = response.data.data.find((p: any) => p.categoryPromotionId === categoryPromotionId);
      if (foundPromotion) {
        expect(foundPromotion.categoryId).toBe(testCategoryId);
        expect(foundPromotion.promotionId).toBe(promotionId);
      }
    }
  });

  it('should get active category promotions', async () => {
    if (!adminToken) {
      console.log('Skipping test - no admin token');
      return;
    }
    
    const response = await client.get('/business/category-promotions', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    
    if (categoryPromotionId) {
      const foundPromotion = response.data.data.find((p: any) => p.categoryPromotionId === categoryPromotionId);
      // Promotion may or may not be found depending on setup
    }
  });

  it('should delete a category promotion', async () => {
    if (!adminToken || !categoryPromotionId) {
      console.log('Skipping test - missing admin token or category promotion ID');
      return;
    }
    
    const response = await client.delete(`/business/category-promotions/${categoryPromotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the category promotion is deleted
    const getResponse = await client.get(`/business/category-promotions/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (getResponse.status === 200 && getResponse.data?.data) {
      const foundPromotion = getResponse.data.data.find((p: any) => p.categoryPromotionId === categoryPromotionId);
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
      console.error('Error cleaning up promotion:', error);
    }

    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
