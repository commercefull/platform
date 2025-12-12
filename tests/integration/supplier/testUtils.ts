import axios, { AxiosInstance } from 'axios';

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

export async function setupSupplierTests() {
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
    throw new Error('Failed to get admin token for Supplier tests');
  }

  return { client, adminToken };
}

export function createTestSupplier(overrides: Partial<any> = {}) {
  return {
    name: `Test Supplier ${Date.now()}`,
    code: `SUP${Date.now()}`,
    contactName: 'John Supplier',
    contactEmail: `supplier-${Date.now()}@example.com`,
    contactPhone: '+1234567890',
    address: {
      addressLine1: '123 Supplier St',
      city: 'Supply City',
      state: 'SC',
      postalCode: '12345',
      country: 'US'
    },
    paymentTerms: 'net30',
    leadTime: 7,
    isActive: true,
    ...overrides
  };
}

export function createTestPurchaseOrder(supplierId: string, overrides: Partial<any> = {}) {
  return {
    supplierId,
    items: [
      { productId: 'prod-001', quantity: 100, unitCost: 10.00 }
    ],
    expectedDeliveryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Integration test PO',
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
