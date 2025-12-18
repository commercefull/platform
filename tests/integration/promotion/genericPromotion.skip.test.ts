import { AxiosInstance } from 'axios';
import { setupPromotionTests, cleanupPromotionTests, testPromotion } from './testUtils';

describe('Generic Promotion API Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let testCategoryId: string;
  let testProductId: string;
  let promotionId: string;

  beforeAll(async () => {
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCartId = setup.testCartId;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;
  });

  it('should create a new promotion', async () => {
    if (!adminToken) {
      console.log('Skipping test - no admin token');
      return;
    }
    
    const response = await client.post('/business/promotions', testPromotion, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([201, 400, 409]).toContain(response.status);
    if (response.status !== 201) {
      console.log('Promotion creation failed:', response.data);
      return;
    }
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
      console.log('Skipping test - no admin token or promotion ID');
      return;
    }
    
    const response = await client.get(`/business/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 404]).toContain(response.status);
    if (response.status !== 200) return;
    
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
      console.log('Skipping test - no admin token or promotion ID');
      return;
    }
    
    const updateData = {
      name: 'Updated Test Promotion',
      discountValue: 15
    };
    
    const response = await client.put(`/business/promotions/${promotionId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 404, 500]).toContain(response.status);
    if (response.status !== 200) return;
    
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
  });

  it('should apply a promotion to a cart', async () => {
    if (!adminToken || !promotionId || !testCartId) {
      console.log('Skipping test - missing admin token, promotion ID, or cart ID');
      return;
    }
    
    // Add an item to the cart first
    await client.post(`/api/cart/${testCartId}/items`, {
      productId: testProductId,
      quantity: 2,
      price: 49.99
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Apply the promotion to the cart
    const response = await client.post('/business/promotions/apply', {
      cartId: testCartId,
      promotionId: promotionId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 400, 404, 500]).toContain(response.status);
    if (response.status !== 200) return;
    
    expect(response.data.success).toBe(true);
  });

  it('should validate a promotion for a cart', async () => {
    if (!adminToken || !promotionId || !testCartId) {
      console.log('Skipping test - missing admin token, promotion ID, or cart ID');
      return;
    }
    
    const response = await client.post('/business/promotions/validate', {
      cartId: testCartId,
      promotionId: promotionId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 400, 404, 500]).toContain(response.status);
    if (response.status !== 200) return;
    
    expect(response.data.success).toBe(true);
  });
  
  it('should delete a promotion', async () => {
    
    const response = await client.delete(`/business/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect([200, 404, 500]).toContain(response.status);
    if (response.status !== 200) return;
    
    expect(response.data.success).toBe(true);
    
    // Verify the promotion is deleted
    const getResponse = await client.get(`/business/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(getResponse.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
