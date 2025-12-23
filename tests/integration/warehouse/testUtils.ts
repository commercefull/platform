import axios, { AxiosInstance } from 'axios';

// Seeded test data IDs from seeds/20240805002100_seedWarehouseTestData.js
export const SEEDED_WAREHOUSE_IDS = {
  MAIN: '0193b000-0000-7000-8000-000000000001',
  WEST_COAST: '0193b000-0000-7000-8000-000000000002',
  EAST_COAST: '0193b000-0000-7000-8000-000000000003',
  RETURNS: '0193b000-0000-7000-8000-000000000004',
};

export const SEEDED_ZONE_IDS = {
  MAIN_STORAGE: '0193b001-0000-7000-8000-000000000001',
  MAIN_PICKING: '0193b001-0000-7000-8000-000000000002',
  MAIN_SHIPPING: '0193b001-0000-7000-8000-000000000003',
  WEST_STORAGE: '0193b001-0000-7000-8000-000000000004',
};

export const SEEDED_BIN_IDS = {
  A1_01: '0193b002-0000-7000-8000-000000000001',
  A1_02: '0193b002-0000-7000-8000-000000000002',
  B1_01: '0193b002-0000-7000-8000-000000000003',
  SHIP_01: '0193b002-0000-7000-8000-000000000004',
};

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123',
};

export function createTestClient(): AxiosInstance {
  return axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });
}

export async function setupWarehouseTests() {
  const client = createTestClient();

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
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
    ...overrides,
  };
}

export function createTestZone(overrides: Partial<any> = {}) {
  return {
    name: `Test Zone ${Date.now()}`,
    code: `Z${Date.now()}`,
    type: 'storage',
    temperature: 'ambient',
    ...overrides,
  };
}

export async function cleanupWarehouseTests(client: AxiosInstance, adminToken: string, resources: { warehouseIds?: string[] } = {}) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.warehouseIds || []) {
    try {
      await client.delete(`/business/warehouses/${id}`, { headers });
    } catch (error) {}
  }
}
