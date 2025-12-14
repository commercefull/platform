import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

// Export loginTestUser function (customer login)
export const loginTestUser = async (
  client: AxiosInstance, 
  email: string = 'customer@example.com', 
  password: string = 'password123'
): Promise<string> => {
  const response = await client.post('/customer/identity/login', {
    email,
    password
  });
  
  if (!response.data.accessToken) {
    throw new Error(`Failed to login test user: ${JSON.stringify(response.data)}`);
  }
  
  return response.data.accessToken;
};

// Export loginTestMerchant function (merchant/admin login)
export const loginTestMerchant = async (
  client: AxiosInstance, 
  email: string = 'merchant@example.com', 
  password: string = 'password123'
): Promise<string> => {
  const response = await client.post('/business/auth/login', {
    email,
    password
  });
  
  if (!response.data.accessToken) {
    throw new Error(`Failed to login merchant: ${JSON.stringify(response.data)}`);
  }
  
  return response.data.accessToken;
};

// Test data for order items (used in order creation)
export const testOrderItemData = {
  productId: '00000000-0000-0000-0000-000000000001', // Valid UUID for test product
  sku: 'TEST-SKU-123',
  name: 'Test Product',
  description: 'Test product description',
  quantity: 2,
  unitPrice: 49.99,
  discountedUnitPrice: 44.99,
  lineTotal: 89.98,
  discountTotal: 10.00,
  taxTotal: 7.50,
  taxRate: 0.075,
  taxExempt: false,
  fulfillmentStatus: 'unfulfilled',
  giftWrapped: false,
  isDigital: false
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
  },
  // Include items for order creation
  items: [testOrderItemData]
};

/**
 * Setup function for order integration tests
 * Creates test data and returns necessary IDs and tokens
 */
export const setupOrderTests = async () => {
  const client = createTestClient();
  const adminToken = await loginTestAdmin(client);
  const customerToken = await loginTestUser(client);
  
  // Create test order (items are included in testOrderData)
  const createOrderResponse = await client.post('/customer/order', {
    ...testOrderData,
    orderNumber: `TEST-${Date.now()}` // Ensure unique order number
  }, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  if (!createOrderResponse.data.success) {
    throw new Error(`Failed to create test order: ${createOrderResponse.data.error}`);
  }
  
  const testOrderId = createOrderResponse.data.data.orderId;
  
  // Get the order item ID from the created order's items
  const orderItems = createOrderResponse.data.data.items || [];
  const testOrderItemId = orderItems.length > 0 ? orderItems[0].orderItemId : null;
  
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
  testOrderId: string
) => {
  try {
    // Delete test order (cascade deletes items)
    await client.delete(`/business/orders/${testOrderId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error cleaning up order test data:', error);
  }
};
