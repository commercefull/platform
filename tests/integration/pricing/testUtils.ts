import axios, { AxiosInstance } from 'axios';

/**
 * Test utilities for Pricing integration tests
 */

const adminCredentials = {
  email: 'merchant@example.com',
  password: 'password123'
};

/**
 * Setup function for Pricing integration tests
 */
export async function setupPricingTests() {
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true'
    }
  });

  // Get admin token
  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = adminLoginResponse.data.accessToken;

  if (!adminLoginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token for Pricing tests');
  }

  return {
    client,
    adminToken
  };
}

/**
 * Create test pricing rule data
 */
export function createTestPricingRule(overrides: Partial<any> = {}) {
  return {
    name: `Test Rule ${Date.now()}`,
    type: 'quantity_based',
    scope: 'global',
    status: 'active',
    priority: 1,
    adjustments: [
      { type: 'percentage', value: 10 }
    ],
    conditions: [
      { type: 'min_quantity', parameters: { value: 1 } }
    ],
    ...overrides
  };
}

// Valid UUID format for test data
const TEST_PRODUCT_UUID = '00000000-0000-0000-0000-000000000001';

/**
 * Create test tier price data
 */
export function createTestTierPrice(productId: string = TEST_PRODUCT_UUID, overrides: Partial<any> = {}) {
  return {
    productId,
    quantityMin: 10,
    price: 9.99,
    ...overrides
  };
}

/**
 * Create test price list data
 */
export function createTestPriceList(overrides: Partial<any> = {}) {
  return {
    name: `Test Price List ${Date.now()}`,
    description: 'Integration test price list',
    priority: 1,
    isActive: true,
    ...overrides
  };
}

/**
 * Create test currency data
 */
export function createTestCurrency(overrides: Partial<any> = {}) {
  return {
    code: 'TST',
    symbol: 'T$',
    name: 'Test Currency',
    decimalPlaces: 2,
    symbolPosition: 'before',
    thousandsSeparator: ',',
    decimalSeparator: '.',
    isActive: true,
    isDefault: false,
    ...overrides
  };
}

/**
 * Create test currency region data
 */
export function createTestCurrencyRegion(overrides: Partial<any> = {}) {
  return {
    code: `TR${Date.now().toString().slice(-6)}`,
    name: `Test Region ${Date.now()}`,
    countries: ['XX', 'YY'],
    currencyCode: 'USD',
    isActive: true,
    ...overrides
  };
}

/**
 * Create test currency price rule data
 */
export function createTestCurrencyPriceRule(overrides: Partial<any> = {}) {
  return {
    name: `Test Currency Price Rule ${Date.now()}`,
    currencyCode: 'USD',
    priority: 1,
    type: 'currency_conversion',
    scope: 'global',
    status: 'active',
    adjustments: [
      { type: 'percentage', value: 5 }
    ],
    ...overrides
  };
}

/**
 * Cleanup function for Pricing integration tests
 */
export async function cleanupPricingTests(
  client: AxiosInstance,
  adminToken: string,
  resources: {
    ruleIds?: string[];
    tierIds?: string[];
    priceListIds?: string[];
    currencyCodes?: string[];
    regionIds?: string[];
    priceRuleIds?: string[];
  } = {}
) {
  const headers = { Authorization: `Bearer ${adminToken}` };

  // Clean up pricing rules
  for (const id of resources.ruleIds || []) {
    try {
      await client.delete(`/business/pricing/rules/${id}`, { headers });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clean up tier prices
  for (const id of resources.tierIds || []) {
    try {
      await client.delete(`/business/pricing/tier-prices/${id}`, { headers });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clean up price lists
  for (const id of resources.priceListIds || []) {
    try {
      await client.delete(`/business/pricing/price-lists/${id}`, { headers });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clean up currencies
  for (const code of resources.currencyCodes || []) {
    try {
      await client.delete(`/business/pricing/currencies/${code}`, { headers });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clean up currency regions
  for (const id of resources.regionIds || []) {
    try {
      await client.delete(`/business/pricing/currency-regions/${id}`, { headers });
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  // Clean up currency price rules
  for (const id of resources.priceRuleIds || []) {
    try {
      await client.delete(`/business/pricing/currency-price-rules/${id}`, { headers });
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}
