
// Test data
export const testGatewayData = {
  name: 'Test Payment Gateway',
  provider: 'stripe',
  isActive: true,
  isTestMode: true,
  apiKey: 'test_api_key_123',
  apiSecret: 'test_api_secret_456',
  supportedPaymentMethods: 'creditCard',
};

export const testMethodConfigData = {
  paymentMethod: 'creditCard',
  isEnabled: true,
  displayName: 'Test Credit Card',
  description: 'Test payment method',
  displayOrder: 1,
  supportedCurrencies: ['USD'],
};

/**
 * Setup function for payment integration tests
 * Creates test data and returns necessary IDs and tokens
 */
// Seeded payment fixtures (seeds/20240805002104_seedPaymentTestData.js)
export const SEEDED_GATEWAY_ID = '00000000-0000-0000-0000-000000008100';
export const SEEDED_METHOD_CONFIG_ID = '00000000-0000-0000-0000-000000008101';
// Seeded test order (seeds/20240805000495_seedTestOrder.js)
export const SEEDED_ORDER_ID = '00000000-0000-0000-0000-000000000200';
