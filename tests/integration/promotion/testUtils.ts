import { AxiosInstance } from 'axios';
import { createTestClient, loginTestUser } from '../testUtils';
import { v4 as uuidv4 } from 'uuid';

// Common test data for promotions
export const testPromotion = {
  name: 'Test Promotion',
  description: 'Test promotion for integration tests',
  status: 'active',
  scope: 'global',
  priority: 1,
  startDate: new Date(new Date().getTime() - 86400000).toISOString(), // Yesterday
  endDate: new Date(new Date().getTime() + 86400000).toISOString(),   // Tomorrow
  discountType: 'percentage',
  discountValue: 10,
  minOrderAmount: 50,
  maxDiscountAmount: 100
};

// Common test data for coupons
export const testCoupon = {
  code: `TEST${Math.floor(Math.random() * 10000)}`,
  name: 'Test Coupon',
  description: 'Test coupon for integration tests',
  type: 'percentage',
  value: 15,
  minOrderAmount: 25,
  maxDiscountAmount: 50,
  startDate: new Date(new Date().getTime() - 86400000).toISOString(),
  endDate: new Date(new Date().getTime() + 86400000).toISOString(),
  usageLimit: 100,
  perCustomerLimit: 1,
  forNewCustomersOnly: false,
  forAutoApply: false,
  status: 'active'
};

// Helper function to create a test cart
export async function createTestCart(client: AxiosInstance, adminToken: string) {
  const cartResponse = await client.post('/api/cart', {
    customerId: `test-customer-${uuidv4()}`,
    items: []
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  return cartResponse.data.data.id;
}

// Helper function to create a test category and product
export async function createTestCategoryAndProduct(client: AxiosInstance, adminToken: string) {
  // Create a test category
  const categoryResponse = await client.post('/api/categories', {
    name: `Test Category ${Math.floor(Math.random() * 10000)}`,
    description: 'Test category for promotion tests'
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  const categoryId = categoryResponse.data.data.id;
  
  // Create a test product in that category
  const productResponse = await client.post('/product', {
    name: `Test Product ${Math.floor(Math.random() * 10000)}`,
    description: 'Test product for promotion tests',
    price: 49.99,
    categories: [categoryId]
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  return {
    categoryId,
    productId: productResponse.data.data.id
  };
}

// Setup function to initialize client and test data
export async function setupPromotionTests() {
  const client = createTestClient();
  // Use merchant login for business routes
  const loginResponse = await client.post('/business/auth/login', {
    email: 'merchant@example.com',
    password: 'password123'
  });
  const adminToken = loginResponse.data.accessToken;
  
  if (!adminToken) {
    throw new Error('Failed to get admin token for promotion tests');
  }
  
  // Create test data: cart, category, product
  const testCartId = await createTestCart(client, adminToken);
  const { categoryId, productId } = await createTestCategoryAndProduct(client, adminToken);
  
  return {
    client,
    adminToken,
    testCartId,
    testCategoryId: categoryId,
    testProductId: productId
  };
}

// Cleanup function to remove test resources
export async function cleanupPromotionTests(
  client: AxiosInstance, 
  adminToken: string, 
  testCartId: string, 
  testProductId: string, 
  testCategoryId: string
) {
  try {
    await client.delete(`/api/cart/${testCartId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    await client.delete(`/product/${testProductId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    await client.delete(`/api/categories/${testCategoryId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error cleaning up test resources:', error);
  }
}
