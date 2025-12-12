import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';

// Test data
export const testCustomer = {
  email: `customer-${Math.floor(Math.random() * 10000)}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'Customer'
};

export const testMerchant = {
  email: `merchant-${Math.floor(Math.random() * 10000)}@example.com`,
  password: 'TestPassword123!',
  name: 'Test Merchant',
  businessName: 'Test Store'
};

export const testAdmin = {
  email: `admin-${Math.floor(Math.random() * 10000)}@example.com`,
  password: 'AdminPassword123!',
  name: 'Test Admin'
};

// Existing admin credentials for setup purposes
const adminCredentials = {
  email: 'merchant@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for auth integration tests
 */
export async function setupAuthTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    } // Don't throw HTTP errors
  });

  // Get admin token
  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials);
  const adminToken = adminLoginResponse.data.accessToken;

  if (!adminLoginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test users
  const testCustomerId = await createTestCustomer(client, adminToken);
  const testMerchantId = await createTestMerchant(client, adminToken);
  const testAdminId = await createTestAdmin(client, adminToken);

  // Create test password reset tokens
  const customerResetToken = await createPasswordResetToken(client, adminToken, testCustomerId, 'customer');
  const merchantResetToken = await createPasswordResetToken(client, adminToken, testMerchantId, 'merchant');

  // Create test refresh token (will simulate a successful login)
  let customerRefreshToken = '';
  try {
    const loginResponse = await client.post('/identity/login', {
      email: testCustomer.email,
      password: testCustomer.password
    });
    
    if (loginResponse.data.success) {
      customerRefreshToken = loginResponse.data.refreshToken;
    }
  } catch (error) {
    console.log('Unable to create refresh token through login');
  }

  return {
    client,
    adminToken,
    testCustomerId,
    testMerchantId,
    testAdminId,
    customerResetToken,
    merchantResetToken,
    customerRefreshToken
  };
}

/**
 * Create a test customer
 */
async function createTestCustomer(client: AxiosInstance, adminToken: string): Promise<string> {
  try {
    // Check if customer already exists
    const existingResponse = await client.get(`/business/customers/email/${testCustomer.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (existingResponse.data.success) {
      return existingResponse.data.data.id;
    }
    
    // Create new customer
    const response = await client.post('/business/customers', {
      email: testCustomer.email,
      password: testCustomer.password,
      firstName: testCustomer.firstName,
      lastName: testCustomer.lastName,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      return response.data.data.id;
    }
    
    throw new Error('Failed to create test customer');
  } catch (error) {
    console.log('Using simulated customer ID');
    return `customer-${crypto.randomBytes(8).toString('hex')}`;
  }
}

/**
 * Create a test merchant
 */
async function createTestMerchant(client: AxiosInstance, adminToken: string): Promise<string> {
  try {
    // Check if merchant already exists
    const existingResponse = await client.get(`/business/merchants/email/${testMerchant.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (existingResponse.data.success) {
      return existingResponse.data.data.id;
    }
    
    // Create new merchant
    const response = await client.post('/business/merchants', {
      email: testMerchant.email,
      password: testMerchant.password,
      name: testMerchant.name,
      businessName: testMerchant.businessName,
      status: 'active'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      return response.data.data.id;
    }
    
    throw new Error('Failed to create test merchant');
  } catch (error) {
    console.log('Using simulated merchant ID');
    return `merchant-${crypto.randomBytes(8).toString('hex')}`;
  }
}

/**
 * Create a test admin
 */
async function createTestAdmin(client: AxiosInstance, adminToken: string): Promise<string> {
  try {
    // Check if admin already exists
    const existingResponse = await client.get(`/business/admins/email/${testAdmin.email}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (existingResponse.data.success) {
      return existingResponse.data.data.id;
    }
    
    // Create new admin
    const response = await client.post('/business/admins', {
      email: testAdmin.email,
      password: testAdmin.password,
      name: testAdmin.name,
      role: 'editor'
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      return response.data.data.id;
    }
    
    throw new Error('Failed to create test admin');
  } catch (error) {
    console.log('Using simulated admin ID');
    return `admin-${crypto.randomBytes(8).toString('hex')}`;
  }
}

/**
 * Create a password reset token
 */
async function createPasswordResetToken(
  client: AxiosInstance, 
  adminToken: string, 
  userId: string, 
  userType: 'customer' | 'merchant' | 'admin'
): Promise<string> {
  try {
    const response = await client.post(`/business/auth/reset-token`, {
      userId,
      userType
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (response.data.success) {
      return response.data.accessToken;
    }
    
    return '';
  } catch (error) {
    console.log('Using simulated password reset token');
    return crypto.randomBytes(16).toString('hex');
  }
}

/**
 * Cleanup function for auth integration tests
 */
export async function cleanupAuthTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    testCustomerId,
    testMerchantId,
    testAdminId,
    customerRefreshToken
  }: {
    testCustomerId?: string,
    testMerchantId?: string,
    testAdminId?: string,
    customerRefreshToken?: string
  }
) {
  try {
    // Revoke refresh token if it exists
    if (customerRefreshToken) {
      await client.post('/api/auth/logout', {
        refreshToken: customerRefreshToken
      });
    }
    
    // Delete test users if they were created
    // Note: In a real test environment, you might want to keep these for speed
    // or clean them up completely depending on your testing strategy
    if (testCustomerId) {
      await client.delete(`/business/customers/${testCustomerId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    
    if (testMerchantId) {
      await client.delete(`/business/merchants/${testMerchantId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
    
    if (testAdminId) {
      await client.delete(`/business/admins/${testAdminId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    }
  } catch (error) {
    console.error('Error during auth test cleanup:', error);
  }
}
