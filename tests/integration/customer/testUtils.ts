import axios, { AxiosInstance } from 'axios';

// Test data
export const testCustomer = {
  email: `test-customer-${Math.floor(Math.random() * 10000)}@example.com`,
  firstName: 'Test',
  lastName: 'Customer',
  password: 'TestPassword123!',
  phone: '555-123-4567',
  dateOfBirth: new Date('1990-01-01').toISOString().split('T')[0],
  isActive: true,
  isVerified: false,
  notes: 'Test customer for integration tests'
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
  email: 'merchant@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for customer integration tests
 */
export async function setupCustomerTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true'
    } // Don't throw HTTP errors
  });

  // Get admin token - Use the same authentication endpoint as the distribution tests
  const loginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = loginResponse.data.accessToken;

  if (!adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test data
  // 1. Create Customer
  const customerResponse = await client.post('/business/customers', testCustomer, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!customerResponse.data.success) {
    console.error('Customer creation failed:', customerResponse.data);
    throw new Error('Failed to create test customer');
  }
  
  const testCustomerId = customerResponse.data.data.customerId || customerResponse.data.data.id;

  // 2. Create Customer Address
  const addressResponse = await client.post(`/business/customers/${testCustomerId}/addresses`, testCustomerAddress, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!addressResponse.data.success) {
    console.error('Address creation failed:', addressResponse.data);
    throw new Error('Failed to create test customer address');
  }
  
  const testCustomerAddressId = addressResponse.data.data.customerAddressId || addressResponse.data.data.addressId || addressResponse.data.data.id;

  // 3. Create Customer Group (optional - endpoint may not exist)
  let testCustomerGroupId = null;
  try {
    const groupResponse = await client.post('/business/customer-groups', testCustomerGroup, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (groupResponse.data.success) {
      testCustomerGroupId = groupResponse.data.data.customerGroupId || groupResponse.data.data.id;
      
      // 4. Add Customer to Group
      await client.post(`/business/customers/${testCustomerId}/groups/${testCustomerGroupId}`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
  } catch (e) {
    console.log('Customer group endpoint not available, skipping group tests');
  }

  // 5. Create Wishlist (optional - endpoint may not exist)
  let testWishlistId = null;
  try {
    const wishlistResponse = await client.post(`/business/customers/${testCustomerId}/wishlists`, {
      ...testCustomerWishlist
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (wishlistResponse.data.success) {
      testWishlistId = wishlistResponse.data.data.customerWishlistId || wishlistResponse.data.data.id;
    }
  } catch (e) {
    console.log('Wishlist endpoint not available, skipping wishlist tests');
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
    await client.delete(`/business/wishlists/${testWishlistId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 2. Delete Customer Group (will also delete memberships)
  if (testCustomerGroupId) {
    await client.delete(`/business/customer-groups/${testCustomerGroupId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 3. Delete Customer Address
  if (testCustomerAddressId) {
    await client.delete(`/business/customer-addresses/${testCustomerAddressId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 4. Delete Customer
  if (testCustomerId) {
    await client.delete(`/business/customers/${testCustomerId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
}
