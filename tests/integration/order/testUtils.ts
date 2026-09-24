import { AxiosInstance } from 'axios';

// Export loginTestUser function (customer login)
export const loginTestUser = async (
  client: AxiosInstance,
  email: string = 'customer@example.com',
  password: string = 'password123',
): Promise<string> => {
  try {
    const response = await client.post('/customer/identity/login', {
      email,
      password,
    });

    return response.data?.accessToken || '';
  } catch {
    return '';
  }
};

// Export loginTestOrganization function (organization/admin login)
export const loginTestOrganization = async (
  client: AxiosInstance,
  email: string = 'merchant@example.com',
  password: string = 'password123',
): Promise<string> => {
  try {
    const response = await client.post('/business/auth/login', {
      email,
      password,
    });

    return response.data?.accessToken || '';
  } catch {
    return '';
  }
};

// Test data for order items (used in order creation)
export const testOrderItemData = {
  productId: '00000000-0000-0000-0000-000000000001', // Existing product in seeded DB
  sku: 'TEST-SKU-123',
  name: 'Test Product',
  description: 'Test product description',
  quantity: 2,
  unitPriceCents: 4999,
  discountedUnitPriceCents: 4499,
  lineTotalCents: 8998,
  discountTotalCents: 1000,
  taxTotalCents: 750,
  taxRate: 0.075,
  taxExempt: false,
  fulfillmentStatus: 'unfulfilled',
  giftWrapped: false,
  isDigital: false,
};

// Test data for orders
export const testOrderData = {
  orderNumber: `TEST-${Date.now()}`,
  status: 'pending',
  paymentStatus: 'pending',
  fulfillmentStatus: 'unfulfilled',
  currencyCode: 'USD',
  subtotalCents: 9999,
  discountTotalCents: 1000,
  taxTotalCents: 750,
  shippingTotalCents: 599,
  handlingFeeCents: 0,
  totalAmountCents: 10348,
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
    phone: '555-123-4567',
  },
  billingAddress: {
    firstName: 'Test',
    lastName: 'Customer',
    address1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
    phone: '555-123-4567',
  },
  // Include items for order creation
  items: [testOrderItemData],
};

/**
 * Setup function for order integration tests
 * Creates test data and returns necessary IDs and tokens
 */
// Seeded test order (seeds/20240805000495_seedTestOrder.js)
export const SEEDED_ORDER_ID = '00000000-0000-0000-0000-000000000200';
export const SEEDED_ORDER_ITEM_ID = '00000000-0000-0000-0000-000000000010';
export const SEEDED_REFUND_ORDER_ID = '00000000-0000-0000-0000-000000000201';
export const SEEDED_SHIPPED_ORDER_ID = '00000000-0000-0000-0000-000000000202';
export const SEEDED_DELIVERED_ORDER_ID = '00000000-0000-0000-0000-000000000203';
export const SEEDED_ORDER_PAYMENT_ID = '00000000-0000-0000-0000-000000000240';
