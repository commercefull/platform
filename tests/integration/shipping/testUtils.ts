import axios, { AxiosInstance } from 'axios';

// Seeded test data IDs from seeds/20240805001600_seedShippingTestData.js
export const SEEDED_CARRIER_IDS = {
  UPS: '01936000-0000-7000-8000-000000000001',
  FEDEX: '01936000-0000-7000-8000-000000000002',
  USPS: '01936000-0000-7000-8000-000000000003'
};

export const SEEDED_METHOD_IDS = {
  UPS_GROUND: '01936001-0000-7000-8000-000000000001',
  UPS_EXPRESS: '01936001-0000-7000-8000-000000000002',
  FEDEX_GROUND: '01936001-0000-7000-8000-000000000003',
  FEDEX_OVERNIGHT: '01936001-0000-7000-8000-000000000004',
  USPS_PRIORITY: '01936001-0000-7000-8000-000000000005',
  FREE_SHIPPING: '01936001-0000-7000-8000-000000000006'
};

export const SEEDED_ZONE_IDS = {
  US_DOMESTIC: '01936002-0000-7000-8000-000000000001',
  US_WEST: '01936002-0000-7000-8000-000000000002',
  INTERNATIONAL: '01936002-0000-7000-8000-000000000003'
};

export const SEEDED_RATE_IDS = {
  UPS_GROUND_US: '01936003-0000-7000-8000-000000000001',
  UPS_EXPRESS_US: '01936003-0000-7000-8000-000000000002',
  FEDEX_GROUND_US: '01936003-0000-7000-8000-000000000003',
  FREE_SHIPPING_US: '01936003-0000-7000-8000-000000000004'
};

export const SEEDED_PACKAGING_IDS = {
  SMALL_BOX: '01936004-0000-7000-8000-000000000001',
  MEDIUM_BOX: '01936004-0000-7000-8000-000000000002',
  LARGE_BOX: '01936004-0000-7000-8000-000000000003',
  ENVELOPE: '01936004-0000-7000-8000-000000000004'
};

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

export async function setupShippingTests() {
  const client = createTestClient();

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = adminLoginResponse.data.accessToken;

  if (!adminToken) {
    throw new Error('Failed to get admin token for Shipping tests');
  }

  return { client, adminToken };
}

export function createTestCarrier(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Carrier ${timestamp}`,
    code: `TC${timestamp}`,
    description: 'Test carrier for integration tests',
    isActive: true,
    hasApiIntegration: false,
    requiresContract: false,
    ...overrides
  };
}

export function createTestMethod(carrierId: string, overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    shippingCarrierId: carrierId,
    name: `Test Method ${timestamp}`,
    code: `TM${timestamp}`,
    description: 'Test method for integration tests',
    isActive: true,
    isDefault: false,
    domesticInternational: 'both',
    displayOnFrontend: true,
    allowFreeShipping: true,
    handlingDays: 1,
    priority: 10,
    ...overrides
  };
}

export function createTestZone(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Zone ${timestamp}`,
    description: 'Test zone for integration tests',
    isActive: true,
    priority: 0,
    locationType: 'country',
    locations: ['US'],
    ...overrides
  };
}

export function createTestRate(zoneId: string, methodId: string, overrides: Partial<any> = {}) {
  return {
    shippingZoneId: zoneId,
    shippingMethodId: methodId,
    name: 'Test Rate',
    isActive: true,
    rateType: 'flat',
    baseRate: '9.99',
    currency: 'USD',
    taxable: true,
    priority: 0,
    ...overrides
  };
}

export async function cleanupShippingTests(
  client: AxiosInstance,
  adminToken: string,
  resources: { 
    carrierIds?: string[]; 
    methodIds?: string[];
    zoneIds?: string[];
    rateIds?: string[];
  } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  // Delete in reverse order of dependencies
  for (const id of resources.rateIds || []) {
    try {
      await client.delete(`/business/shipping/rates/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.methodIds || []) {
    try {
      await client.delete(`/business/shipping/methods/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.zoneIds || []) {
    try {
      await client.delete(`/business/shipping/zones/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.carrierIds || []) {
    try {
      await client.delete(`/business/shipping/carriers/${id}`, { headers });
    } catch (error) {}
  }
}
