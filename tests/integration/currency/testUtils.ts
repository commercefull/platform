import axios, { AxiosInstance } from 'axios';

// Test data
export const testCurrency = {
  code: `TST${Math.floor(Math.random() * 1000)}`,
  name: 'Test Currency',
  symbol: '₮',
  decimals: 2,
  isDefault: false,
  isActive: true,
  exchangeRate: 1.25,
  lastUpdated: Date.now(),
  format: '₮#,##0.00',
  position: 'before' as const,
  thousandsSeparator: ',',
  decimalSeparator: '.'
};

export const testCurrencyRegion = {
  regionCode: `R${Math.floor(Math.random() * 1000)}`,
  regionName: 'Test Region',
  currencyCode: '', // Will be set to testCurrency.code during setup
  isActive: true
};

export const testPriceRule = {
  name: 'Test Price Rule',
  description: 'Test price rule for integration tests',
  type: 'percentage' as const,
  value: 10, // 10% markup
  currencyCode: '', // Will be set to testCurrency.code during setup
  priority: 10,
  isActive: true
};

// Test credentials
const adminCredentials = {
  email: 'merchant@example.com', // Replace with valid admin credentials
  password: 'password123'     // Replace with valid admin password
};

/**
 * Setup function for currency integration tests
 */
export async function setupCurrencyTests() {
  // Create client
  const client = axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true'
    } // Don't throw HTTP errors
  });

  // Get admin token - Use the same authentication endpoint as other features
  const loginResponse = await client.post('/business/auth/login', adminCredentials, { headers: { 'X-Test-Request': 'true' } });
  const adminToken = loginResponse.data.accessToken;

  if (!loginResponse.data.success || !adminToken) {
    throw new Error('Failed to get admin token');
  }

  // Create test data
  // 1. Create Currency
  const currencyResponse = await client.post('/business/pricing/currencies', testCurrency, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!currencyResponse.data.success) {
    throw new Error('Failed to create test currency');
  }
  
  // 2. Create Currency Region
  const testRegion = {
    ...testCurrencyRegion,
    currencyCode: testCurrency.code
  };
  
  const regionResponse = await client.post('/business/pricing/currency-regions', testRegion, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!regionResponse.data.success) {
    throw new Error('Failed to create test currency region');
  }
  
  const testCurrencyRegionId = regionResponse.data.data.id;

  // 3. Create Price Rule
  const testRule = {
    ...testPriceRule,
    currencyCode: testCurrency.code
  };
  
  const ruleResponse = await client.post('/business/pricing/currency-price-rules', testRule, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!ruleResponse.data.success) {
    throw new Error('Failed to create test price rule');
  }
  
  const testPriceRuleId = ruleResponse.data.data.id;

  // Return all test data and helper objects
  return {
    client,
    adminToken,
    testCurrencyCode: testCurrency.code,
    testCurrencyRegionId,
    testCurrencyRegionCode: testRegion.regionCode,
    testPriceRuleId
  };
}

/**
 * Cleanup function for currency integration tests
 */
export async function cleanupCurrencyTests(
  client: AxiosInstance, 
  adminToken: string, 
  { 
    testCurrencyCode,
    testCurrencyRegionCode,
    testPriceRuleId
  }: {
    testCurrencyCode: string,
    testCurrencyRegionCode: string,
    testPriceRuleId: string
  }
) {
  // Delete in reverse order of dependencies
  // 1. Delete Price Rule
  if (testPriceRuleId) {
    await client.delete(`/business/pricing/currency-price-rules/${testPriceRuleId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 2. Delete Currency Region
  if (testCurrencyRegionCode) {
    await client.delete(`/business/pricing/currency-regions/${testCurrencyRegionCode}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }

  // 3. Delete Currency
  if (testCurrencyCode) {
    await client.delete(`/business/pricing/currencies/${testCurrencyCode}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  }
}
