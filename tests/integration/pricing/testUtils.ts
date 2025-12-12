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
      'Content-Type': 'application/json'
    }
  });

  // Get admin token
  const adminLoginResponse = await client.post('/business/auth/login', adminCredentials);
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
    ruleType: 'percentage',
    discountValue: 10,
    conditions: {
      minQuantity: 1
    },
    priority: 1,
    isActive: true,
    ...overrides
  };
}

/**
 * Create test tier price data
 */
export function createTestTierPrice(productId: string, overrides: Partial<any> = {}) {
  return {
    productId,
    minQuantity: 10,
    maxQuantity: 50,
    price: 9.99,
    discountType: 'percentage',
    discountValue: 5,
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
    exchangeRate: 1.5,
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
    currencyCode: 'EUR',
    adjustmentType: 'percentage',
    adjustmentValue: 5,
    roundingMethod: 'nearest',
    roundingPrecision: 2,
    isActive: true,
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
