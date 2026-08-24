import axios, { AxiosInstance } from 'axios';

// Seeded test IDs from seeds/20240805002001_seedIntegrationTestData.js
export const SEEDED_CUSTOMER_ID = '00000000-0000-0000-0000-000000001001';
export const SEEDED_CUSTOMER_EMAIL = 'testcustomer@example.com';
export const SEEDED_CUSTOMER_ADDRESS_ID = '00000000-0000-0000-0000-000000006001';
export const SEEDED_CUSTOMER_GROUP_ID = '00000000-0000-0000-0000-000000006002';
export const SEEDED_CUSTOMER_WISHLIST_ID = '00000000-0000-0000-0000-000000006004';

// Test data for creating new entities within individual tests
export const testCustomer = {
  email: 'testcustomer@example.com',
  firstName: 'Test',
  lastName: 'Customer',
  password: 'TestPassword123!',
  phone: '555-123-4567',
  dateOfBirth: new Date('1990-01-01').toISOString().split('T')[0],
  isActive: true,
  isVerified: false,
  note: 'Test customer for integration tests',
};

export const testCustomerAddress = {
  addressLine1: '123 Test Street',
  addressLine2: 'Apt 456',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'US',
  addressType: 'shipping',
  isDefault: true,
  phone: '555-987-6543',
};

export const testCustomerGroup = {
  name: 'Test VIP Group',
  description: 'Test customer group for integration tests',
  discountPercent: 10,
  isActive: true,
};

export const testCustomerWishlist = {
  name: 'Test Wishlist',
  isPublic: false,
};

// Test credentials
const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123',
};

/**
 * Setup function for customer integration tests
 * Uses seeded data — only retrieves auth token
 */
export async function setupCustomerTests() {
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  let adminToken = '';

  try {
    const loginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
    adminToken = loginResponse.data?.accessToken || '';
  } catch {}

  return {
    client,
    adminToken,
    testCustomerId: SEEDED_CUSTOMER_ID,
    testCustomerAddressId: SEEDED_CUSTOMER_ADDRESS_ID,
    testCustomerGroupId: SEEDED_CUSTOMER_GROUP_ID,
    testWishlistId: SEEDED_CUSTOMER_WISHLIST_ID,
  };
}

/**
 * Cleanup function for customer integration tests
 */
export async function cleanupCustomerTests(
  client: AxiosInstance,
  adminToken: string,
  {
    testCustomerId,
    testCustomerAddressId,
    testCustomerGroupId,
    testWishlistId,
  }: {
    testCustomerId: string;
    testCustomerAddressId: string;
    testCustomerGroupId: string | null;
    testWishlistId: string | null;
  },
) {
  // Delete in reverse order of dependencies
  // 1. Delete Wishlist (if created)
  if (testWishlistId) {
    await client.delete(`/business/wishlists/${testWishlistId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // 2. Delete Customer Group (will also delete memberships)
  if (testCustomerGroupId) {
    await client.delete(`/business/customer-groups/${testCustomerGroupId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }

  // 3. Delete Customer Address
  if (testCustomerAddressId) {
    await client.delete(`/business/customers/${testCustomerId}/addresses/${testCustomerAddressId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).catch(() => {});
  }

  // 4. Delete Customer
  if (testCustomerId) {
    await client.delete(`/business/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
  }
}
