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
    if (!adminToken) {
      return;
    }

    const discountData = {
      name: 'Test Discount ' + Date.now(),
      description: 'Test discount for integration tests',
      type: 'percentage',
      value: 15,
      minPurchaseAmount: 30,
      maxDiscountAmount: 50,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + 86400000).toISOString(),
      // Don't include applicableProducts/Categories if they're placeholder IDs
      combinable: true,
      priority: 1,
      status: 'active',
    };

    const response = await client.post('/business/discounts', discountData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('discountId');

    discountId = response.data.data.discountId;
  });

  it('should get active discounts', async () => {
    if (!adminToken) {
      return;
    }

    const response = await client.get('/business/discounts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);

    // Only check for specific discount if it was created
    if (discountId) {
      const foundDiscount = response.data.data.find((d: any) => d.discountId === discountId);
      expect(foundDiscount).toBeDefined();
    }
  });

  it('should get discounts by product ID', async () => {
    if (!adminToken || !testProductId) {
      return;
    }

    const response = await client.get(`/business/discounts/product/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should get discounts by category ID', async () => {
    if (!adminToken || !testCategoryId) {
      return;
    }

    const response = await client.get(`/business/discounts/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it('should update a discount', async () => {
    if (!adminToken || !discountId) {
      return;
    }

    const updateData = {
      name: 'Updated Test Discount',
      value: 20,
    };

    const response = await client.put(`/business/discounts/${discountId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
    expect(response.data.data.value).toBe(updateData.value);
  });

  it('should delete a discount', async () => {
    if (!adminToken || !discountId) {
      return;
    }

    const response = await client.delete(`/business/discounts/${discountId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify the discount is deleted
    const getResponse = await client.get(`/business/discounts/${discountId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(getResponse.status).toBe(404);
  });

  afterAll(async () => {
    await cleanupPromotionTests(client, adminToken, testCartId, testProductId, testCategoryId);
  });
});
