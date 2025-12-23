import axios, { AxiosInstance } from 'axios';

// Seeded test data IDs from seeds/20240805002000_seedTaxTestData.js
export const SEEDED_TAX_CATEGORY_IDS = {
  STANDARD: '0193a000-0000-7000-8000-000000000001',
  REDUCED: '0193a000-0000-7000-8000-000000000002',
  ZERO: '0193a000-0000-7000-8000-000000000003',
  EXEMPT: '0193a000-0000-7000-8000-000000000004',
};

export const SEEDED_TAX_ZONE_IDS = {
  US_DOMESTIC: '0193a001-0000-7000-8000-000000000001',
  US_CALIFORNIA: '0193a001-0000-7000-8000-000000000002',
  EU_STANDARD: '0193a001-0000-7000-8000-000000000003',
  UK: '0193a001-0000-7000-8000-000000000004',
};

export const SEEDED_TAX_RATE_IDS = {
  US_STANDARD: '0193a002-0000-7000-8000-000000000001',
  US_CA_STATE: '0193a002-0000-7000-8000-000000000002',
  EU_VAT_STANDARD: '0193a002-0000-7000-8000-000000000003',
  UK_VAT: '0193a002-0000-7000-8000-000000000004',
  ZERO_RATE: '0193a002-0000-7000-8000-000000000005',
};

export const SEEDED_TAX_RULE_IDS = {
  ELECTRONICS: '0193a003-0000-7000-8000-000000000001',
  FOOD: '0193a003-0000-7000-8000-000000000002',
};

export const SEEDED_TAX_SETTINGS_IDS = {
  DEFAULT: '0193a004-0000-7000-8000-000000000001',
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

export async function setupTaxTests() {
  const client = createTestClient();

  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = adminLoginResponse.data.accessToken;

  if (!adminToken) {
    throw new Error('Failed to get admin token for Tax tests');
  }

  return { client, adminToken };
}

export function createTestTaxCategory(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Category ${timestamp}`,
    code: `test-${timestamp}`,
    description: 'Integration test tax category',
    isDefault: false,
    sortOrder: 100,
    isActive: true,
    ...overrides,
  };
}

export function createTestTaxZone(overrides: Partial<any> = {}) {
  const timestamp = Date.now();
  return {
    name: `Test Zone ${timestamp}`,
    code: `TZ-${timestamp}`,
    description: 'Integration test tax zone',
    isDefault: false,
    countries: ['US'],
    isActive: true,
    ...overrides,
  };
}

export function createTestTaxRate(taxCategoryId: string, taxZoneId: string, overrides: Partial<any> = {}) {
  return {
    taxCategoryId,
    taxZoneId,
    name: `Test Rate ${Date.now()}`,
    rate: 10.0,
    type: 'percentage',
    priority: 1,
    isCompound: false,
    includeInPrice: false,
    isShippingTaxable: true,
    isActive: true,
    ...overrides,
  };
}

export function createTestTaxRule(taxRateId: string, overrides: Partial<any> = {}) {
  return {
    taxRateId,
    name: `Test Rule ${Date.now()}`,
    description: 'Integration test tax rule',
    conditionType: 'category',
    conditionValue: { categoryCode: 'test' },
    sortOrder: 1,
    isActive: true,
    ...overrides,
  };
}

export async function cleanupTaxTests(
  client: AxiosInstance,
  adminToken: string,
  resources: {
    categoryIds?: string[];
    zoneIds?: string[];
    rateIds?: string[];
    ruleIds?: string[];
  } = {},
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  for (const id of resources.ruleIds || []) {
    try {
      await client.delete(`/business/tax/rules/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.rateIds || []) {
    try {
      await client.delete(`/business/tax/rates/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.zoneIds || []) {
    try {
      await client.delete(`/business/tax/zones/${id}`, { headers });
    } catch (error) {}
  }

  for (const id of resources.categoryIds || []) {
    try {
      await client.delete(`/business/tax/categories/${id}`, { headers });
    } catch (error) {}
  }
}
