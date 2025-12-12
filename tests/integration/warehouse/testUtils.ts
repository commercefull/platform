import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

export async function setupWarehouseTests() {
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
    throw new Error('Failed to get admin token for Warehouse tests');
  }

  return { client, adminToken };
}

export function createTestWarehouse(overrides: Partial<any> = {}) {
  return {
    name: `Test Warehouse ${Date.now()}`,
    code: `WH${Date.now()}`,
    addressLine1: '123 Warehouse Blvd',
    city: 'Warehouse City',
    state: 'WC',
    postalCode: '54321',
    country: 'US',
    isActive: true,
    isFulfillmentCenter: true,
    isReturnCenter: false,
    ...overrides
  };
}

export function createTestZone(overrides: Partial<any> = {}) {
  return {
    name: `Test Zone ${Date.now()}`,
    code: `Z${Date.now()}`,
    type: 'storage',
    temperature: 'ambient',
    ...overrides
  };
}

export async function cleanupWarehouseTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { warehouseIds?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.warehouseIds || []) {
    try {
      await client.delete(`/business/warehouses/${id}`, { headers });
    } catch (error) {}
  }
}
