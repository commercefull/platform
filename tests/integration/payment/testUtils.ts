import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, loginTestUser } from '../testUtils';

// Test data
export const testGatewayData = {
  name: 'Test Payment Gateway',
  provider: 'stripe',
  isActive: true,
  isTestMode: true,
  apiKey: 'test_api_key_123',
  apiSecret: 'test_api_secret_456',
  supportedPaymentMethods: 'creditCard'
};

export const testMethodConfigData = {
  paymentMethod: 'creditCard',
  isEnabled: true,
  displayName: 'Test Credit Card',
  description: 'Test payment method',
  displayOrder: 1,
  supportedCurrencies: ['USD']
};

/**
 * Setup function for payment integration tests
 * Creates test data and returns necessary IDs and tokens
 */
export const setupPaymentTests = async () => {
  const client = createTestClient();
  
  let adminToken = '';
  let customerToken = '';
  
  try {
    adminToken = await loginTestAdmin(client);
  } catch (error: any) {
    
  }
  
  try {
    customerToken = await loginTestUser(client);
  } catch (error: any) {
    
  }
  
  let testGatewayId = '';
  let testMethodConfigId = '';
  
  // Try to create test gateway
  try {
    const gatewayResponse = await client.post('/business/gateways', testGatewayData, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (gatewayResponse.data.success && gatewayResponse.data.data) {
      testGatewayId = gatewayResponse.data.data.paymentGatewayId || gatewayResponse.data.data.id || '';
    }
  } catch (error: any) {
    
  }
  
  // Try to create test method config
  if (testGatewayId) {
    try {
      const methodConfigResponse = await client.post('/business/method-configs', {
        ...testMethodConfigData,
        gatewayId: testGatewayId
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (methodConfigResponse.data.success && methodConfigResponse.data.data) {
        testMethodConfigId = methodConfigResponse.data.data.paymentMethodConfigId || methodConfigResponse.data.data.id || '';
      }
    } catch (error: any) {
      
    }
  }
  
  return {
    client,
    adminToken,
    customerToken,
    testGatewayId,
    testMethodConfigId,
    testTransactionId: '' // Will be created in tests if needed
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
  testMethodConfigId: string
) => {
  // Delete test method config
  if (testMethodConfigId) {
    try {
      await client.delete(`/business/method-configs/${testMethodConfigId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (e) { /* ignore */ }
  }
  
  // Delete test gateway
  if (testGatewayId) {
    try {
      await client.delete(`/business/gateways/${testGatewayId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    } catch (e) { /* ignore */ }
  }
};
