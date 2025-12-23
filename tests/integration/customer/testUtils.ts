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

  let adminToken = '';
  let testCustomerId = '';
  let testCustomerAddressId = '';
  let testCustomerGroupId: string | null = null;
  let testWishlistId: string | null = null;

  try {
    // Get admin token - Use the same authentication endpoint as the distribution tests
    const loginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
    adminToken = loginResponse.data?.accessToken || '';

    if (!adminToken) {
      
      return { client, adminToken, testCustomerId, testCustomerAddressId, testCustomerGroupId, testWishlistId };
    }
  } catch (error) {
    
    return { client, adminToken, testCustomerId, testCustomerAddressId, testCustomerGroupId, testWishlistId };
  }

  try {
    // Create test data
    // 1. Create Customer
    const customerResponse = await client.post('/business/customers', testCustomer, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (customerResponse.data?.success && customerResponse.data?.data) {
      testCustomerId = customerResponse.data.data.customerId || customerResponse.data.data.id || '';
    } else {
      
    }

    // 2. Create Customer Address (only if customer was created)
    if (testCustomerId) {
      const addressResponse = await client.post(`/business/customers/${testCustomerId}/addresses`, testCustomerAddress, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (addressResponse.data?.success && addressResponse.data?.data) {
        testCustomerAddressId = addressResponse.data.data.customerAddressId || addressResponse.data.data.addressId || addressResponse.data.data.id || '';
      } else {
        
      }

      // 3. Create Customer Group (optional - endpoint may not exist)
      try {
        const groupResponse = await client.post('/business/customer-groups', testCustomerGroup, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (groupResponse.data?.success && groupResponse.data?.data) {
          testCustomerGroupId = groupResponse.data.data.customerGroupId || groupResponse.data.data.id;
          
          // 4. Add Customer to Group
          await client.post(`/business/customers/${testCustomerId}/groups/${testCustomerGroupId}`, {}, {
            headers: { Authorization: `Bearer ${adminToken}` }
          });
        }
      } catch (e) {
        
      }

      // 5. Create Wishlist (optional - endpoint may not exist)
      try {
        const wishlistResponse = await client.post(`/business/customers/${testCustomerId}/wishlists`, {
          ...testCustomerWishlist
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        
        if (wishlistResponse.data?.success && wishlistResponse.data?.data) {
          testWishlistId = wishlistResponse.data.data.customerWishlistId || wishlistResponse.data.data.id;
        }
      } catch (e) {
        
      }
    }
  } catch (error) {
    
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
    testCustomerGroupId: string | null,
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
