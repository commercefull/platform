import { AxiosInstance } from 'axios';
import { SEEDED_PRODUCT_CATEGORY_ID, SEEDED_PRODUCT_ID } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Discount Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCategoryId: string;
  let testProductId: string;
  let discountId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    testCategoryId = SEEDED_PRODUCT_CATEGORY_ID;
    testProductId = SEEDED_PRODUCT_ID;
  });

  it('should create a discount', async () => {
    if (!adminToken) {
      return;
    }

    const discountData = {
      name: 'Test Discount ' + Date.now(),
      description: 'Test discount for integration tests',
      discountType: 'percentage',
      discountValue: 15,
      minimumAmount: 30,
      maximumDiscountAmount: 50,
      startDate: new Date().toISOString(),
      endDate: new Date(new Date().getTime() + 86400000).toISOString(),
      stackable: true,
      priority: 1,
      isActive: true,
    };

    const response = await client.post('/business/discounts', discountData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('promotionProductDiscountId');

    discountId = response.data.data.promotionProductDiscountId;
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
      const foundDiscount = response.data.data.find((d: Record<string, unknown>) => d.promotionProductDiscountId === discountId);
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
      discountValue: 20,
    };

    const response = await client.put(`/business/discounts/${discountId}`, updateData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(response.data.data.name).toBe(updateData.name);
    expect(parseFloat(response.data.data.discountValue)).toBe(updateData.discountValue);
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

});
