import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

const customerCredentials = {
  email: 'customer@example.com',
  password: 'password123'
};

export async function setupSubscriptionTests() {
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
  });

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials);
  const adminToken = adminLoginResponse.data.accessToken;

  const customerLoginResponse = await client.post('/business/auth/login', customerCredentials);
  const customerToken = customerLoginResponse.data.accessToken;

  if (!adminToken || !customerToken) {
    throw new Error('Failed to get tokens for Subscription tests');
  }

  return { client, adminToken, customerToken };
}

export function createTestSubscriptionProduct(overrides: Partial<any> = {}) {
  return {
    name: `Test Subscription Product ${Date.now()}`,
    description: 'Integration test subscription product',
    billingInterval: 'monthly',
    isActive: true,
    ...overrides
  };
}

export function createTestSubscriptionPlan(overrides: Partial<any> = {}) {
  return {
    name: `Test Plan ${Date.now()}`,
    price: 29.99,
    billingPeriod: 1,
    billingInterval: 'monthly',
    trialDays: 14,
    features: ['Feature 1', 'Feature 2'],
    isActive: true,
    ...overrides
  };
}

export async function cleanupSubscriptionTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { productIds?: string[]; planIds?: string[]; subscriptionIds?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.subscriptionIds || []) {
    try {
      await client.post(`/business/subscriptions/subscriptions/${id}/cancel`, {}, { headers });
    } catch (error) {}
  }

  for (const id of resources.productIds || []) {
    try {
      await client.delete(`/business/subscriptions/products/${id}`, { headers });
    } catch (error) {}
  }
}
