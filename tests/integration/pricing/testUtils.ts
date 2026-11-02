
/**
 * Test utilities for Pricing integration tests
 */



/**
 * Create test pricing rule data
 */
export function createTestPricingRule(overrides: Partial<unknown> = {}) {
  return {
    name: `Test Rule ${Date.now()}`,
    type: 'quantity_based',
    scope: 'global',
    status: 'active',
    priority: 1,
    adjustments: [{ type: 'percentage', value: 10 }],
    conditions: [{ type: 'min_quantity', parameters: { value: 1 } }],
    ...overrides,
  };
}

// Valid UUID format for test data
const TEST_PRODUCT_UUID = '00000000-0000-0000-0000-000000000001';

/**
 * Create test tier price data
 */
export function createTestTierPrice(productId: string = TEST_PRODUCT_UUID, overrides: Partial<unknown> = {}) {
  return {
    productId,
    quantityMin: 10,
    priceCents: 999,
    ...overrides,
  };
}

/**
 * Create test price list data
 */
export function createTestPriceList(overrides: Partial<unknown> = {}) {
  return {
    name: `Test Price List ${Date.now()}`,
    description: 'Integration test price list',
    priority: 1,
    isActive: true,
    ...overrides,
  };
}

/**
 * Create test currency data
 */
export function createTestCurrency(overrides: Partial<unknown> = {}) {
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
    ...overrides,
  };
}

/**
 * Create test currency region data
 */
export function createTestCurrencyRegion(overrides: Partial<unknown> = {}) {
  return {
    code: `TR${Date.now().toString().slice(-6)}`,
    name: `Test Region ${Date.now()}`,
    countries: ['XX', 'YY'],
    currencyCode: 'USD',
    isActive: true,
    ...overrides,
  };
}

/**
 * Create test currency price rule data
 */
export function createTestCurrencyPriceRule(overrides: Partial<unknown> = {}) {
  return {
    name: `Test Currency Price Rule ${Date.now()}`,
    currencyCode: 'USD',
    priority: 1,
    type: 'currency_conversion',
    scope: 'global',
    status: 'active',
    adjustments: [{ type: 'percentage', value: 5 }],
    ...overrides,
  };
}


