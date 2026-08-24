import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Seeded test data IDs
// From seeds/20241220000023_seedStoreInventoryLocations.js
export const SEEDED_INVENTORY_LOCATION_ID = '20000000-0000-7001-8000-000000000001';
export const SEEDED_STORE_WAREHOUSE_ID = '20000000-0000-7000-8000-000000000001';
// From seeds/20240805002001_seedIntegrationTestData.js
export const SEEDED_PRODUCT_ID = '00000000-0000-0000-0000-000000000001';

// Sample test data for creating new entities within individual tests
export const testInventoryItem = {
  productId: SEEDED_PRODUCT_ID,
  sku: 'TEST-SKU-001',
  quantity: 100,
  reservedQuantity: 0,
  availableQuantity: 100,
  lowStockThreshold: 10,
  reorderPoint: 20,
  reorderQuantity: 50,
};

export const testInventoryLocation = {
  name: 'Test Warehouse',
  type: 'warehouse',
  address: '123 Test St',
  city: 'Testville',
  state: 'TS',
  country: 'Testland',
  postalCode: '12345',
  isActive: true,
};

// Setup helper function — uses seeded data, only retrieves auth token
export const setupInventoryTests = async () => {
  const client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  let adminToken = '';
  try {
    const adminLogin = await client.post('/business/auth/login', {
      email: 'merchant@example.com',
      password: 'password123',
    });
    adminToken = adminLogin.data?.accessToken || '';
  } catch {}

  return {
    client,
    adminToken,
    testProductId: SEEDED_PRODUCT_ID,
    testLocationId: SEEDED_STORE_WAREHOUSE_ID,
    testInventoryItemId: SEEDED_INVENTORY_LOCATION_ID,
  };
};

// Cleanup helper function — no-op for seeded data
export const cleanupInventoryTests = async (
  _client: AxiosInstance | undefined,
  _adminToken: string | undefined,
  _testInventoryItemId?: string,
  _testLocationId?: string,
) => {};
