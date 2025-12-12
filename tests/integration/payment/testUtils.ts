import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

// Test data
export const testGateway = {
  name: 'Test Payment Gateway',
  provider: 'stripe',
  isActive: true,
  apiKey: 'test_api_key_123',
  apiSecret: 'test_api_secret_456',
  sandboxMode: true,
  merchantId: 'test-merchant-id-123',
  metadata: {
    supportedCurrencies: ['USD', 'EUR', 'GBP']
  }
};

export const testMethodConfig = {
  name: 'Test Credit Card',
  type: 'credit_card',
  isActive: true,
  gatewayId: '', // This will be set during setup
  merchantId: 'test-merchant-id-123',
  settings: {
    supportedCards: ['visa', 'mastercard'],
    requireCVV: true
  },
  displayOrder: 1
};

export const testTransaction = {
  amount: 99.99,
  currency: 'USD',
  customerId: 'test-customer-id-123',
  orderId: 'test-order-id-123',
  methodConfigId: '', // This will be set during setup
  metadata: {
    items: [
      { name: 'Test Product', quantity: 1, price: 99.99 }
    ]
  }
};

export const testRefund = {
  amount: 99.99,
  reason: 'Customer requested',
  transactionId: '', // This will be set during setup
};

/**
 * Setup function for payment integration tests
 * Creates test data and returns necessary IDs and tokens
 */
export const setupPaymentTests = async () => {
  const client = createTestClient();
  const adminToken = await loginTestAdmin(client);
  const customerToken = await loginTestUser(client);
  
  // Create test gateway
  const gatewayResponse = await client.post('/business/gateways', testGateway, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!gatewayResponse.data.success) {
    throw new Error(`Failed to create test gateway: ${gatewayResponse.data.error}`);
  }
  
  const testGatewayId = gatewayResponse.data.data.id;
  
  // Create test method config
  const methodConfig = {
    ...testMethodConfig,
    gatewayId: testGatewayId
  };
  
  const methodConfigResponse = await client.post('/business/method-configs', methodConfig, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!methodConfigResponse.data.success) {
    throw new Error(`Failed to create test method config: ${methodConfigResponse.data.error}`);
  }
  
  const testMethodConfigId = methodConfigResponse.data.data.id;
  
  // Create test transaction
  const transaction = {
    ...testTransaction,
    methodConfigId: testMethodConfigId
  };
  
  const transactionResponse = await client.post('/api/transactions', transaction, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  if (!transactionResponse.data.success) {
    throw new Error(`Failed to create test transaction: ${transactionResponse.data.error}`);
  }
  
  const testTransactionId = transactionResponse.data.data.id;
  
  return {
    client,
    adminToken,
    customerToken,
    testGatewayId,
    testMethodConfigId,
    testTransactionId
  };
};

/**
 * Cleanup function for payment integration tests
 * Removes test data created during setup
 */
export const cleanupPaymentTests = async (
  client: AxiosInstance, 
  adminToken: string, 
  testGatewayId: string, 
  testMethodConfigId: string, 
  testTransactionId: string
) => {
  // Delete test transaction
  await client.delete(`/business/transactions/${testTransactionId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  // Delete test method config
  await client.delete(`/business/method-configs/${testMethodConfigId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  // Delete test gateway
  await client.delete(`/business/gateways/${testGatewayId}`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
};
