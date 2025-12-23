import axios, { AxiosInstance } from 'axios';

// Token cache to avoid repeated login calls
let cachedAdminToken: string | null = null;
let cachedCustomerToken: string | null = null;
let adminTokenCacheTime: number = 0;
let customerTokenCacheTime: number = 0;
const TOKEN_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Create a configured API client for testing
 */
export const createTestClient = (baseURL: string = 'http://localhost:3000'): AxiosInstance => {
  return axios.create({
    baseURL,
    validateStatus: () => true, // Don't throw HTTP errors so we can test them
    timeout: 10000, // 10 second timeout to prevent hanging
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true' // Skip rate limiting for test requests
    }
  });
};

/**
 * Test authentication helper - logs in a test user and returns auth token
 * Uses caching to avoid repeated login calls
 */
export const loginTestUser = async (client: AxiosInstance, email: string = 'testcustomer@example.com', password: string = 'password123'): Promise<string> => {
  // Return cached token if valid
  if (cachedCustomerToken && Date.now() - customerTokenCacheTime < TOKEN_CACHE_TTL) {
    return cachedCustomerToken;
  }

  console.log(`🔐 Logging in customer: ${email}`);

  try {
    const response = await client.post('/customer/identity/login', {
      email,
      password,
    }, {
      headers: { 'X-Test-Request': 'true' }
    });

    console.log(`🔐 Customer login response: ${response.status}`);

    if (response.status !== 200 || !response.data?.accessToken) {
      
      // Return empty string instead of throwing to prevent cascade failures
      return '';
    }

    cachedCustomerToken = response.data.accessToken;
    customerTokenCacheTime = Date.now();
    console.log('✅ Customer login successful');
    return response.data.accessToken;
  } catch (error: any) {
    console.error('❌ Customer login error (server may not be running):', error.message);
    return '';
  }
};

/**
 * Test authentication helper - logs in an admin/merchant user and returns auth token
 * Uses caching to avoid repeated login calls
 */
export const loginTestAdmin = async (client: AxiosInstance): Promise<string> => {
  // Return cached token if valid
  if (cachedAdminToken && Date.now() - adminTokenCacheTime < TOKEN_CACHE_TTL) {
    return cachedAdminToken;
  }

  console.log('🔐 Logging in merchant: merchant@example.com');

  try {
    const response = await client.post('/business/auth/login', {
      email: 'merchant@example.com',
      password: 'password123',
    }, {
      headers: { 'X-Test-Request': 'true' }
    });

    console.log(`🔐 Merchant login response: ${response.status}`);

    if (response.status !== 200 || !response.data?.accessToken) {
      
      return '';
    }

    cachedAdminToken = response.data.accessToken;
    adminTokenCacheTime = Date.now();
    console.log('✅ Merchant login successful');
    return response.data.accessToken;
  } catch (error: any) {
    console.error('❌ Merchant login error (server may not be running):', error.message);
    return '';
  }
};

/**
 * Clear cached tokens (useful for testing auth flows)
 */
export const clearTokenCache = (): void => {
  cachedAdminToken = null;
  cachedCustomerToken = null;
  adminTokenCacheTime = 0;
  customerTokenCacheTime = 0;
};

/**
 * Debug helper to check current token status
 */
export const debugTokens = (): void => {
  console.log('🔍 Token Debug:');
  console.log(`  Admin token: ${cachedAdminToken ? '✅ cached' : '❌ none'} (${cachedAdminToken ? new Date(adminTokenCacheTime).toISOString() : 'never'})`);
  console.log(`  Customer token: ${cachedCustomerToken ? '✅ cached' : '❌ none'} (${cachedCustomerToken ? new Date(customerTokenCacheTime).toISOString() : 'never'})`);
};
