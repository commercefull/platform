import { AxiosInstance } from 'axios';
import { setupPaymentTests, cleanupPaymentTests, testMethodConfig } from './testUtils';

describe('Payment Method Configuration Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testGatewayId: string;
  let testMethodConfigId: string;
  let testTransactionId: string;

  beforeAll(async () => {
    const setup = await setupPaymentTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    testGatewayId = setup.testGatewayId;
    testMethodConfigId = setup.testMethodConfigId;
    testTransactionId = setup.testTransactionId;
  });

  afterAll(async () => {
    await cleanupPaymentTests(
      client,
      adminToken,
      testGatewayId,
      testMethodConfigId,
      testTransactionId
    );
  });

  describe('Admin Method Config Operations', () => {
    it('should get all method configurations for a merchant', async () => {
      const response = await client.get(`/business/merchants/${testMethodConfig.merchantId}/method-configs`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Check that the test method config is included in the results
      const foundConfig = response.data.data.find((c: any) => c.id === testMethodConfigId);
      expect(foundConfig).toBeDefined();
      expect(foundConfig.name).toBe(testMethodConfig.name);
      expect(foundConfig.type).toBe(testMethodConfig.type);
    });

    it('should get a method configuration by ID', async () => {
      const response = await client.get(`/business/method-configs/${testMethodConfigId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testMethodConfigId);
      expect(response.data.data).toHaveProperty('name', testMethodConfig.name);
      expect(response.data.data).toHaveProperty('type', testMethodConfig.type);
      expect(response.data.data).toHaveProperty('isActive', testMethodConfig.isActive);
      expect(response.data.data).toHaveProperty('gatewayId');
      expect(response.data.data).toHaveProperty('settings');
      
      // Verify settings are properly stored and returned
      expect(response.data.data.settings).toHaveProperty('supportedCards');
      expect(Array.isArray(response.data.data.settings.supportedCards)).toBe(true);
    });

    it('should create a new method configuration', async () => {
      const newMethodConfig = {
        name: 'New Test Method',
        type: 'digital_wallet',
        isActive: true,
        gatewayId: testGatewayId,
        merchantId: testMethodConfig.merchantId,
        settings: {
          walletTypes: ['apple_pay', 'google_pay'],
          requireBillingAddress: false
        },
        displayOrder: 2
      };
      
      const response = await client.post('/business/method-configs', newMethodConfig, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', newMethodConfig.name);
      expect(response.data.data).toHaveProperty('type', newMethodConfig.type);
      expect(response.data.data).toHaveProperty('settings');
      expect(response.data.data.settings).toHaveProperty('walletTypes');
      
      // Clean up - delete the new method config
      const newMethodConfigId = response.data.data.id;
      await client.delete(`/business/method-configs/${newMethodConfigId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update an existing method configuration', async () => {
      const updates = {
        name: 'Updated Method Name',
        isActive: false,
        settings: {
          ...testMethodConfig.settings,
          requireCVV: false
        }
      };
      
      const response = await client.put(`/business/method-configs/${testMethodConfigId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testMethodConfigId);
      expect(response.data.data).toHaveProperty('name', updates.name);
      expect(response.data.data).toHaveProperty('isActive', updates.isActive);
      expect(response.data.data.settings).toHaveProperty('requireCVV', false);
      
      // Reset to original values for other tests
      await client.put(`/business/method-configs/${testMethodConfigId}`, {
        name: testMethodConfig.name,
        isActive: testMethodConfig.isActive,
        settings: testMethodConfig.settings
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });
  });

  describe('Public Method Config Operations', () => {
    it('should get active payment methods for customers', async () => {
      const response = await client.get(`/api/payment-methods`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Since we created an active method, we should find it
      const activeMethod = response.data.data.find((m: any) => m.id === testMethodConfigId);
      expect(activeMethod).toBeDefined();
      
      // Public API should not expose sensitive gateway information
      expect(activeMethod).not.toHaveProperty('gatewayId');
      expect(activeMethod).not.toHaveProperty('apiKey');
      expect(activeMethod).not.toHaveProperty('apiSecret');
    });
  });
});
