import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

export async function setupShippingTests() {
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

  if (!adminToken) {
    throw new Error('Failed to get admin token for Shipping tests');
  }

  return { client, adminToken };
}

export function createTestCarrier(overrides: Partial<any> = {}) {
  return {
    name: `Test Carrier ${Date.now()}`,
    code: `TC${Date.now()}`,
    type: 'custom',
    apiCredentials: {},
    isActive: true,
    ...overrides
  };
}

export async function cleanupShippingTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { carrierIds?: string[]; labelIds?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.carrierIds || []) {
    try {
      await client.delete(`/business/shipping/carriers/${id}`, { headers });
    } catch (error) {}
  }
}
