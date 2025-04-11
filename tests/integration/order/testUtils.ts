import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

// Export loginTestUser function
export const loginTestUser = async (
  client: AxiosInstance, 
  email: string = 'customer@example.com', 
  password: string = 'password123'
): Promise<string> => {
  const response = await client.post('/api/auth/login', {
    email,
    password
  });
  
  if (!response.data.success) {
    throw new Error(`Failed to login test user: ${response.data.error}`);
  }
  
  return response.data.data.token;
};

// Test data for orders
export const testOrderData = {
  orderNumber: `TEST-${Date.now()}`,
  status: 'pending',
  paymentStatus: 'pending',
  fulfillmentStatus: 'unfulfilled',
  currencyCode: 'USD',
  subtotal: 99.99,
  discountTotal: 10.00,
  taxTotal: 7.50,
  shippingTotal: 5.99,
  handlingFee: 0,
  totalAmount: 103.48,
  totalItems: 2,
  totalQuantity: 3,
  taxExempt: false,
  customerEmail: 'test@example.com',
  customerPhone: '555-123-4567',
  customerName: 'Test Customer',
  hasGiftWrapping: false,
  isGift: false,
  isSubscriptionOrder: false,
  shippingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    address1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
    phone: '555-123-4567'
  },
  billingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    address1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
    phone: '555-123-4567'
  }
};

// Test data for order items
export const testOrderItemData = {
  productId: 'test-product-id',
  variantId: 'test-variant-id',
  sku: 'TEST-SKU-123',
  name: 'Test Product',
  description: 'Test product description',
  quantity: 2,
  unitPrice: 49.99,
  price: 49.99,
  subtotal: 99.98,
  discountTotal: 10.00,
  taxTotal: 7.50,
  total: 97.48,
  weight: 1.5,
  taxRate: 0.075,
  taxClass: 'standard',
  options: {
    color: 'Blue',
    size: 'Medium'
  }
};

/**
 * Setup function for order integration tests
 * Creates test data and returns necessary IDs and tokens
 */
export const setupOrderTests = async () => {
  const client = createTestClient();
  const adminToken = await loginTestAdmin(client);
  const customerToken = await loginTestUser(client);
  
  // Create test order
  const createOrderResponse = await client.post('/api/orders', {
    ...testOrderData,
    customerId: 'test-customer-id-123' // Will be overwritten by the actual customer ID in the createOrder endpoint
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  if (!createOrderResponse.data.success) {
    throw new Error(`Failed to create test order: ${createOrderResponse.data.error}`);
  }
  
  const testOrderId = createOrderResponse.data.data.id;
  
  // Create test order item
  const createOrderItemResponse = await client.post('/api/admin/order-items', {
    ...testOrderItemData,
    orderId: testOrderId
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!createOrderItemResponse.data.success) {
    throw new Error(`Failed to create test order item: ${createOrderItemResponse.data.error}`);
  }
  
  const testOrderItemId = createOrderItemResponse.data.data.id;
  
  return {
    client,
    adminToken,
    customerToken,
    testOrderId,
    testOrderItemId
  };
};

/**
 * Cleanup function for order integration tests
 * Removes test data created during setup
 */
export const cleanupOrderTests = async (
  client: AxiosInstance, 
  adminToken: string, 
  testOrderId: string, 
  testOrderItemId: string
) => {
  try {
    // Delete test order item
    await client.delete(`/api/admin/order-items/${testOrderItemId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test order
    await client.delete(`/api/admin/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error cleaning up order test data:', error);
  }
};
