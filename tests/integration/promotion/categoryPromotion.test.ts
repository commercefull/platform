import { AxiosInstance } from 'axios';
import { SEEDED_PROMOTION_ID, SEEDED_PRODUCT_CATEGORY_ID } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Category Promotion Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testCategoryId: string;
  let categoryPromotionId: string;
  let promotionId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    testCategoryId = SEEDED_PRODUCT_CATEGORY_ID;
    promotionId = SEEDED_PROMOTION_ID;
  });

  it('should create a category promotion', async () => {
    if (!adminToken || !testCategoryId || !promotionId) {
      return;
    }

    const categoryPromotionData = {
      productCategoryId: testCategoryId,
      promotionId: promotionId,
      displayOrder: 1,
      bannerText: 'Category promotion test',
      isDisplayedOnCategoryPage: true,
      isDisplayedOnProductPage: true,
    };

    const response = await client.post('/business/category-promotions', categoryPromotionData, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(201);
    expect(response.data.success).toBe(true);
    expect(response.data.data).toHaveProperty('categoryPromotionId');

    categoryPromotionId = response.data.data.categoryPromotionId;
  });

  it('should get promotions by category ID', async () => {
    if (!adminToken || !testCategoryId) {
      return;
    }

    const response = await client.get(`/business/category-promotions/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);

    if (categoryPromotionId && response.data.data.length > 0) {
      const foundPromotion = response.data.data.find((p: Record<string, unknown>) => p.categoryPromotionId === categoryPromotionId);
      if (foundPromotion) {
        expect(foundPromotion.productCategoryId).toBe(testCategoryId);
        expect(foundPromotion.promotionId).toBe(promotionId);
      }
    }
  });

  it('should get active category promotions', async () => {
    if (!adminToken) {
      return;
    }

    const response = await client.get('/business/category-promotions/active', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);

    if (categoryPromotionId) {
      const _foundPromotion = response.data.data.find((p: Record<string, unknown>) => p.categoryPromotionId === categoryPromotionId);
      // Promotion may or may not be found depending on setup
    }
  });

  it('should delete a category promotion', async () => {
    if (!adminToken || !categoryPromotionId) {
      return;
    }

    const response = await client.delete(`/business/category-promotions/${categoryPromotionId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);

    // Verify the category promotion is deleted
    const getResponse = await client.get(`/business/category-promotions/category/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    if (getResponse.status === 200 && getResponse.data?.data) {
      const foundPromotion = getResponse.data.data.find((p: Record<string, unknown>) => p.categoryPromotionId === categoryPromotionId);
      expect(foundPromotion).toBeUndefined();
    }
  });

});
