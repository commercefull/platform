import axios, { AxiosInstance } from 'axios';

// Seeded test data IDs from seeds/20240805001800_seedSupplierTestData.js
export const SEEDED_SUPPLIER_IDS = {
  ACME_CORP: '01938000-0000-7000-8000-000000000001',
  GLOBAL_PARTS: '01938000-0000-7000-8000-000000000002',
  QUALITY_GOODS: '01938000-0000-7000-8000-000000000003'
};

export const SEEDED_SUPPLIER_ADDRESS_IDS = {
  ACME_HQ: '01938001-0000-7000-8000-000000000001',
  ACME_WAREHOUSE: '01938001-0000-7000-8000-000000000002',
  GLOBAL_HQ: '01938001-0000-7000-8000-000000000003'
};

export const SEEDED_SUPPLIER_PRODUCT_IDS = {
  WIDGET_A: '01938002-0000-7000-8000-000000000001',
  WIDGET_B: '01938002-0000-7000-8000-000000000002',
  GADGET_X: '01938002-0000-7000-8000-000000000003'
};

export const SEEDED_PURCHASE_ORDER_IDS = {
  PO_001: '01938003-0000-7000-8000-000000000001',
  PO_002: '01938003-0000-7000-8000-000000000002'
};

// Warehouse ID from seeds/20240805002100_seedWarehouseTestData.js
export const SEEDED_WAREHOUSE_ID = '0193b000-0000-7000-8000-000000000001';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

export function createTestClient(): AxiosInstance {
  return axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true'
    }
  });
}

export async function setupSupplierTests() {
  const client = createTestClient();

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = adminLoginResponse.data.accessToken;

  if (!adminToken) {
    throw new Error('Failed to get admin token for Supplier tests');
  }

  return { client, adminToken };
}

export function createTestSupplier(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Supplier ${timestamp}`,
    code: `TS${timestamp}`,
    description: 'Integration test supplier',
    email: `supplier-${timestamp}@example.com`,
    phone: '+1-555-0000',
    isActive: true,
    isApproved: true,
    status: 'active',
    paymentTerms: 'Net 30',
    paymentMethod: 'wire_transfer',
    currency: 'USD',
    minOrderValue: 50.00,
    leadTime: 7,
    categories: ['test'],
    tags: ['integration-test'],
    ...overrides
  };
}

export function createTestPurchaseOrder(supplierId: string, warehouseId: string, overrides: Partial<any> = {}) {
  return {
    supplierId,
    warehouseId,
    orderType: 'standard',
    priority: 'normal',
    currency: 'USD',
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Integration test PO',
    items: [
      {
        productId: '00000000-0000-0000-0000-000000000001',
        sku: 'TEST-SKU-001',
        name: 'Test Product',
        quantity: 10,
        unitCost: 9.99
      }
    ],
    ...overrides
  };
}

export function createTestSupplierAddress(supplierId: string, overrides: Partial<any> = {}) {
  return {
    supplierId,
    name: 'Test Address',
    addressLine1: '123 Test St',
    city: 'Test City',
    state: 'TS',
    postalCode: '12345',
    country: 'US',
    addressType: 'headquarters',
    isDefault: false,
    isActive: true,
    ...overrides
  };
}

export async function cleanupSupplierTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { supplierIds?: string[]; poIds?: string[] } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.poIds || []) {
    try {
      await client.post(`/business/suppliers/purchase-orders/${id}/cancel`, { reason: 'Cleanup' }, { headers });
    } catch (error) {}
  }

  for (const id of resources.supplierIds || []) {
    try {
      await client.delete(`/business/suppliers/${id}`, { headers });
    } catch (error) {}
  }
}
