import axios, { AxiosInstance } from 'axios';

// Global type for per-test-file database isolation
declare global {
   
  var __testDb: { testDatabaseName?: string } | undefined;
}

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
      ...getTestDbHeaders(),
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true', // Skip rate limiting for test requests
    },
  });
};

/**
 * Returns the X-Test-Database header for the current test file's isolated DB.
 * Use this when creating axios clients manually outside of createTestClient.
 */
export const getTestDbHeaders = (): Record<string, string> => {
  const testDbName = global.__testDb?.testDatabaseName;
  return testDbName ? { 'X-Test-Database': testDbName } : {};
};

/**
 * Test authentication helper - logs in a test user and returns auth token
 * Uses caching to avoid repeated login calls
 */
export const loginTestUser = async (
  client: AxiosInstance,
  email: string = 'testcustomer@example.com',
  password: string = 'password123',
): Promise<string> => {
  // Return cached token if valid
  if (cachedCustomerToken && Date.now() - customerTokenCacheTime < TOKEN_CACHE_TTL) {
    return cachedCustomerToken;
  }

  try {
    const response = await client.post(
      '/customer/identity/login',
      {
        email,
        password,
      },
      {
        headers: { 'X-Test-Request': 'true' },
      },
    );

    if (response.status !== 200 || !response.data?.accessToken) {
      // Return empty string instead of throwing to prevent cascade failures
      return '';
    }

    cachedCustomerToken = response.data.accessToken;
    customerTokenCacheTime = Date.now();

    return response.data.accessToken;
  } catch (error: unknown) {
    console.error('❌ Customer login error (server may not be running):', (error as Error).message);
    return '';
  }
};

/**
 * Test authentication helper - logs in an admin/organization user and returns auth token
 * Uses caching to avoid repeated login calls
 */
export const loginTestAdmin = async (client: AxiosInstance): Promise<string> => {
  // Return cached token if valid
  if (cachedAdminToken && Date.now() - adminTokenCacheTime < TOKEN_CACHE_TTL) {
    return cachedAdminToken;
  }

  try {
    const response = await client.post(
      '/business/auth/login',
      {
        email: 'merchant@example.com',
        password: 'password123',
      },
      {
        headers: { 'X-Test-Request': 'true' },
      },
    );

    if (response.status !== 200 || !response.data?.accessToken) {
      return '';
    }

    cachedAdminToken = response.data.accessToken;
    adminTokenCacheTime = Date.now();

    return response.data.accessToken;
  } catch (error: unknown) {
    console.error('❌ Organization login error (server may not be running):', (error as Error).message);
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
 * Assert response status with detailed error logging for traceability.
 * Logs response status, body, and error details when the assertion fails.
 */
export const expectStatus = (
  response: { status: number; data?: unknown; config?: { url?: string; method?: string } },
  expected: number,
): void => {
  if (response.status !== expected) {
    const url = (response.config?.method || 'GET').toUpperCase() + ' ' + (response.config?.url || 'unknown');
    console.error(`\n❌ STATUS ASSERTION FAILED: ${url}`);
    console.error(`   Expected: ${expected}`);
    console.error(`   Actual:   ${response.status}`);
    console.error(`   Response body: ${JSON.stringify(response.data, null, 2)}`);
  }
  expect(response.status).toBe(expected);
};

/**
 * Debug helper to check current token status
 */
export const debugTokens = (): void => {
  console.log(
    `  Admin token: ${cachedAdminToken ? '✅ cached' : '❌ none'} (${cachedAdminToken ? new Date(adminTokenCacheTime).toISOString() : 'never'})`,
  );
  console.log(
    `  Customer token: ${cachedCustomerToken ? '✅ cached' : '❌ none'} (${cachedCustomerToken ? new Date(customerTokenCacheTime).toISOString() : 'never'})`,
  );
};
