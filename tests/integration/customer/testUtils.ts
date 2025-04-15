import axios, { AxiosInstance } from 'axios';

// Test data
export const testCustomer = {
  email: `test-customer-${Math.floor(Math.random() * 10000)}@example.com`,
  firstName: 'Test',
  lastName: 'Customer',
  phone: '555-123-4567',
  dateOfBirth: new Date('1990-01-01').toISOString().split('T')[0],
  isActive: true,
  isVerified: false,
  notes: 'Test customer for integration tests',
  metadata: { source: 'integration_test' }
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
  phone: '555-987-6543'
};

export const testCustomerGroup = {
  name: `Test Group ${Math.floor(Math.random() * 10000)}`,
  description: 'Test customer group for integration tests',
  discountPercentage: 10,
  isActive: true
};

export const testCustomerWishlist = {
  name: 'Test Wishlist',
  isPublic: false
};

// Test credentials - IMPORTANT: Make sure these match working credentials in the system
const adminCredentials = {
  email: 'admin@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for customer integration tests
 */
export async function setupCustomerTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true // Don't throw HTTP errors
  });

  // Get admin token - Use the same authentication endpoint as the distribution tests
  const loginResponse = await client.post('/api/auth/login', adminCredentials);
  const adminToken = loginResponse.data.token;

  if (!adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test data
  // 1. Create Customer
  const customerResponse = await client.post('/api/admin/customers', testCustomer, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!customerResponse.data.success) {
    throw new Error('Failed to create test customer');
  }
  
  const testCustomerId = customerResponse.data.data.id;

  // 2. Create Customer Address
  const addressResponse = await client.post(`/api/admin/customers/${testCustomerId}/addresses`, testCustomerAddress, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!addressResponse.data.success) {
    throw new Error('Failed to create test customer address');
  }
  
  const testCustomerAddressId = addressResponse.data.data.id;

  // 3. Create Customer Group
  const groupResponse = await client.post('/api/admin/customer-groups', testCustomerGroup, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!groupResponse.data.success) {
    throw new Error('Failed to create test customer group');
  }
  
  const testCustomerGroupId = groupResponse.data.data.id;

  // 4. Add Customer to Group
  const membershipResponse = await client.post(`/api/admin/customers/${testCustomerId}/groups/${testCustomerGroupId}`, {}, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!membershipResponse.data.success) {
    throw new Error('Failed to add customer to group');
  }

  // 5. Create Wishlist
  const wishlistResponse = await client.post(`/api/admin/customers/${testCustomerId}/wishlists`, {
    ...testCustomerWishlist
  }, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  let testWishlistId = null;
  if (wishlistResponse.data.success) {
    testWishlistId = wishlistResponse.data.data.id;
  }

  // Return all test data and helper objects
  return {
    client,
    adminToken,
    testCustomerId,
    testCustomerAddressId,
    testCustomerGroupId,
    testWishlistId
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
    testWishlistId
  }: {
    testCustomerId: string,
    testCustomerAddressId: string,
    testCustomerGroupId: string,
    testWishlistId: string | null
  }
) {
  // Delete in reverse order of dependencies
  // 1. Delete Wishlist (if created)
  if (testWishlistId) {
    await client.delete(`/api/admin/wishlists/${testWishlistId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 2. Delete Customer Group (will also delete memberships)
  if (testCustomerGroupId) {
    await client.delete(`/api/admin/customer-groups/${testCustomerGroupId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 3. Delete Customer Address
  if (testCustomerAddressId) {
    await client.delete(`/api/admin/customer-addresses/${testCustomerAddressId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 4. Delete Customer
  if (testCustomerId) {
    await client.delete(`/api/admin/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
}
