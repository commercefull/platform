import axios, { AxiosInstance } from 'axios';

/**
 * Test utilities for GDPR integration tests
 */

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

const customerCredentials = {
  email: 'customer@example.com',
  password: 'password123'
};

/**
 * Setup function for GDPR integration tests
 */
export async function setupGdprTests() {
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  // Get admin token
  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials);
  const adminToken = adminLoginResponse.data?.accessToken || adminLoginResponse.data?.data?.accessToken;

  if (adminLoginResponse.status !== 200 || !adminToken) {
    console.error('Admin login failed:', adminLoginResponse.status, adminLoginResponse.data);
    throw new Error('Failed to get admin token for GDPR tests');
  }

  // Get customer token
  const customerLoginResponse = await client.post('/identity/login', customerCredentials);
  const customerToken = customerLoginResponse.data?.accessToken || customerLoginResponse.data?.data?.accessToken;

  if (customerLoginResponse.status !== 200 || !customerToken) {
    console.error('Customer login failed:', customerLoginResponse.status, customerLoginResponse.data);
    throw new Error('Failed to get customer token for GDPR tests');
  }

  return {
    client,
    adminToken,
    customerToken
  };
}

/**
 * Generate a unique consent ID for testing
 */
export function generateConsentId(): string {
  return `test-consent-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Cleanup function for GDPR integration tests
 */
export async function cleanupGdprTests(
  client: AxiosInstance,
  adminToken: string,
  requestIds: string[] = [],
  consentIds: string[] = []
) {
  // Clean up test data requests
  for (const requestId of requestIds) {
    try {
      // Try to reject any pending requests
      await client.post(`/business/gdpr/requests/${requestId}/reject`, {
        reason: 'Test cleanup'
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}
