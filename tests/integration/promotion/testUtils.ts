import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../testUtils';
import { v4 as uuidv4 } from 'uuid';

// Seeded promotion test data IDs (from seeds/20240805001500_seedPromotionTestData.js)
export const SEEDED_PROMOTION_ID = '01935f00-0000-7000-8000-000000000001';
export const SEEDED_PROMOTION_CART_ID = '01935f00-0000-7000-8000-000000000002';
export const SEEDED_COUPON_ID = '01935f00-0000-7000-8000-000000000010';
export const SEEDED_COUPON_PERCENTAGE_ID = '01935f00-0000-7000-8000-000000000011';
export const SEEDED_COUPON_EXPIRED_ID = '01935f00-0000-7000-8000-000000000012';
export const SEEDED_PRODUCT_DISCOUNT_ID = '01935f00-0000-7000-8000-000000000020';
export const SEEDED_GIFT_CARD_ID = '01935f00-0000-7000-8000-000000000030';
export const SEEDED_GIFT_CARD_DEPLETED_ID = '01935f00-0000-7000-8000-000000000031';

// Common test data for promotions
export const testPromotion = {
  name: 'Test Promotion',
  description: 'Test promotion for integration tests',
  status: 'active',
  scope: 'global',
  priority: 1,
  startDate: new Date(new Date().getTime() - 86400000).toISOString(), // Yesterday
  endDate: new Date(new Date().getTime() + 86400000).toISOString(), // Tomorrow
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 50,
  maxDiscountAmount: 100,
};

// Common test data for coupons (matching new schema)
export const testCoupon = {
  code: `TEST${Math.floor(Math.random() * 10000)}`,
  name: 'Test Coupon',
  description: 'Test coupon for integration tests',
  type: 'percentage',
  discountAmount: 15,
  currencyCode: 'USD',
  minOrderAmount: 25,
  maxDiscountAmount: 50,
  startDate: new Date(new Date().getTime() - 86400000).toISOString(),
  endDate: new Date(new Date().getTime() + 86400000).toISOString(),
  maxUsage: 100,
  maxUsagePerCustomer: 1,
  isActive: true,
  isOneTimeUse: false,
  generationMethod: 'manual',
  isReferral: false,
  isPublic: true,
};

// Seeded coupon codes for testing
export const SEEDED_COUPON_CODE_FIXED = 'TESTFIXED10';
export const SEEDED_COUPON_CODE_PERCENTAGE = 'TESTPERCENT15';
export const SEEDED_COUPON_CODE_EXPIRED = 'EXPIRED20';
export const SEEDED_GIFT_CARD_CODE = 'GIFT-TEST-0001';

// Helper function to create a test cart
export async function createTestCart(client: AxiosInstance, adminToken: string) {
  try {
    const cartResponse = await client.post('/customer/basket', {
      sessionId: `test-session-${uuidv4()}`,
    });

    if (cartResponse.data?.data?.basketId) {
      return cartResponse.data.data.basketId;
    }
    // Return a placeholder if cart creation fails
    return `test-cart-${uuidv4()}`;
  } catch (error) {
    return `test-cart-${uuidv4()}`;
  }
}

// Helper function to create a test category and product
export async function createTestCategoryAndProduct(client: AxiosInstance, adminToken: string) {
  try {
    // Use seeded product IDs instead of creating new ones
    // This avoids dependency on category/product creation endpoints
    return {
      categoryId: '00000000-0000-0000-0000-000000000001',
      productId: '00000000-0000-0000-0000-000000000001',
    };
  } catch (error) {
    return {
      categoryId: `test-category-${uuidv4()}`,
      productId: `test-product-${uuidv4()}`,
    };
  }
}

// Setup function to initialize client and test data
export async function setupPromotionTests() {
  const client = createTestClient();
  let adminToken = '';

  try {
    // Use merchant login for business routes
    const loginResponse = await client.post('/business/auth/login', {
      email: 'merchant@example.com',
      password: 'password123',
    });
    adminToken = loginResponse.data?.accessToken || '';

    if (!adminToken) {
    }
  } catch (error) {}

  // Create test data: cart, category, product
  const testCartId = await createTestCart(client, adminToken);
  const { categoryId, productId } = await createTestCategoryAndProduct(client, adminToken);

  return {
    client,
    adminToken,
    testCartId,
    testCategoryId: categoryId,
    testProductId: productId,
  };
}

// Cleanup function to remove test resources
export async function cleanupPromotionTests(
  client: AxiosInstance | undefined,
  adminToken: string | undefined,
  testCartId?: string,
  testProductId?: string,
  testCategoryId?: string,
) {
  // Skip cleanup if client or token not available
  if (!client || !adminToken) {
    return;
  }

  try {
    // Only attempt cleanup for resources that were actually created
    if (testCartId && !testCartId.startsWith('test-cart-')) {
      await client.delete(`/customer/basket/${testCartId}`).catch(() => {});
    }
    // Don't delete seeded products/categories
  } catch (error) {
    // Silently ignore cleanup errors
  }
}
