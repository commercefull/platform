import { AxiosInstance } from 'axios';
import { setupPromotionTests, cleanupPromotionTests } from './testUtils';

describe('Discount Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCartId: string;
  let testCategoryId: string;
  let testProductId: string;
  let discountId: string;

  beforeAll(async () => {
    const setup = await setupPromotionTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testCartId = setup.testCartId;
    testCategoryId = setup.testCategoryId;
    testProductId = setup.testProductId;
  });

  it('should create a discount', async () => {
    const discountData = {
      name: 'Test Discount',
      description: 'Test discount for integration tests',
      type: 'percentage',
      value: 15,
      minPurchaseAmount: 30,
      maxDiscountAmount: 50,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + 86400000).toISOString(),
      applicableProducts: [testProductId],
      applicableCategories: [testCategoryId],
      combinable: true,
      priority: 1,
      status: 'active'
    };
    
    const response = await client.post('/api/admin/discounts', discountData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('discountId');
    
    discountId = response.data.data.discountId;
  });

  it('should get active discounts', async () => {
    const response = await client.get('/api/admin/discounts', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    
    const foundDiscount = response.data.data.find((d: any) => d.discountId === discountId);
    expect(foundDiscount).toBeDefined();
  });

  it('should get discounts by product ID', async () => {
    const response = await client.get(`/api/admin/discounts/product/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
    
    const foundDiscount = response.data.data.find((d: any) => d.discountId === discountId);
    expect(foundDiscount).toBeDefined();
  });

  it('should get discounts by category ID', async () => {
    const response = await client.get(`/api/admin/discounts/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
    expect(response.data.data.length).toBeGreaterThan(0);
    
    const foundDiscount = response.data.data.find((d: any) => d.discountId === discountId);
    expect(foundDiscount).toBeDefined();
  });

  it('should update a discount', async () => {
    const updateData = {
      name: 'Updated Test Discount',
      value: 20
    };
    
    const response = await client.put(`/api/admin/discounts/${discountId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
    expect(response.data.data.value).toBe(updateData.value);
  });

  it('should delete a discount', async () => {
    const response = await client.delete(`/api/admin/discounts/${discountId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify the discount is deleted
    const getResponse = await client.get(`/api/admin/discounts/${discountId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    expect(getResponse.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
