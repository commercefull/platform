import axios, { AxiosInstance } from 'axios';

// ============================================================================
// Test Constants - Use seeded data from database
// ============================================================================

export const TEST_CUSTOMER = {
  email: 'customer@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Customer',
};

export const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
  name: 'Test Organization',
  businessName: 'Test Store',
};

// Legacy exports for backward compatibility
export const testCustomer = TEST_CUSTOMER;
export const testOrganization = TEST_MERCHANT;
export const testAdmin = TEST_MERCHANT; // Use organization as admin for now

// ============================================================================
// Setup Functions
// ============================================================================



/**
 * Setup function for identity integration tests
 */
export async function setupIdentityTests() {
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
    // Get admin/organization token
    const adminLoginResponse = await client.post('/business/auth/login', {
      email: TEST_MERCHANT.email,
      password: TEST_MERCHANT.password,
    });

    adminToken = adminLoginResponse.data?.accessToken || '';
    if (!adminToken) {
    }
  } catch {}

  return { client, adminToken };
}

/**
 * Legacy setup function for backward compatibility
 */
export async function setupAuthTests() {
  const { client, adminToken } = await setupIdentityTests();

  return {
    client,
    adminToken,
    testCustomerId: '',
    testOrganizationId: '',
    testAdminId: '',
    customerResetToken: '',
    organizationResetToken: '',
    customerRefreshToken: '',
  };
}

/**
 * Cleanup function for identity integration tests
 */
export async function cleanupIdentityTests() {
  // No cleanup needed - we use seeded data
}

/**
 * Legacy cleanup function for backward compatibility
 */
export async function cleanupAuthTests(
  _client: AxiosInstance,
  _adminToken: string,
  _params: {
    testCustomerId?: string;
    testOrganizationId?: string;
    testAdminId?: string;
    customerRefreshToken?: string;
  },
) {
  // No cleanup needed - we use seeded data
}
