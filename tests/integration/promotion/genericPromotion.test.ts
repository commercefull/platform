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
    const response = await client.post('/api/admin/promotions', testPromotion, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('id');
    
    // Save the promotion ID for later tests
    promotionId = response.data.data.id;
    
    // Validate the promotion data
    expect(response.data.data.name).toBe(testPromotion.name);
    expect(response.data.data.discountType).toBe(testPromotion.discountType);
    expect(response.data.data.discountValue).toBe(testPromotion.discountValue);
  });

  it('should get a promotion by ID', async () => {
    const response = await client.get(`/api/admin/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.id).toBe(promotionId);
  });

  it('should update a promotion', async () => {
    const updateData = {
      name: 'Updated Test Promotion',
      discountValue: 15
    };
    
    const response = await client.put(`/api/admin/promotions/${promotionId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
    expect(response.data.data.discountValue).toBe(updateData.discountValue);
  });

  it('should apply a promotion to a cart', async () => {
    // Add an item to the cart first
    await client.post(`/api/cart/${testCartId}/items`, {
      productId: testProductId,
      quantity: 2,
      price: 49.99
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Apply the promotion to the cart
    const response = await client.post('/api/admin/promotions/apply', {
      cartId: testCartId,
      promotionId: promotionId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('discountAmount');
    
    // Validate that the discount was calculated correctly
    // 2 items at 49.99 each = 99.98, 15% discount = 14.997 (about 15)
    expect(response.data.data.discountAmount).toBeCloseTo(15, 0);
  });

  it('should validate a promotion for a cart', async () => {
    const response = await client.post('/api/admin/promotions/validate', {
      cartId: testCartId,
      promotionId: promotionId
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('valid');
    expect(response.data.data.valid).toBe(true);
  });
  
  it('should delete a promotion', async () => {
    const response = await client.delete(`/api/admin/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the promotion is deleted
    const getResponse = await client.get(`/api/admin/promotions/${promotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(getResponse.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
