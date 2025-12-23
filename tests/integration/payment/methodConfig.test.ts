import { AxiosInstance } from 'axios';
import { setupPaymentTests, cleanupPaymentTests, testMethodConfigData } from './testUtils';

describe('Payment Method Configuration Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testGatewayId: string;
  let testMethodConfigId: string;

  beforeAll(async () => {
    const setup = await setupPaymentTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    testGatewayId = setup.testGatewayId;
    testMethodConfigId = setup.testMethodConfigId;
  });

  afterAll(async () => {
    await cleanupPaymentTests(client, adminToken, testGatewayId, testMethodConfigId);
  });

  describe('Admin Method Config Operations', () => {
    it('should get all method configurations for a merchant', async () => {
      const response = await client.get('/business/method-configs', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a method configuration by ID', async () => {
      if (!testMethodConfigId) {
        return;
      }

      const response = await client.get(`/business/method-configs/${testMethodConfigId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('paymentMethodConfigId');
      expect(response.data.data).toHaveProperty('paymentMethod');
    });

    it('should create a new method configuration', async () => {
      if (!testGatewayId) {
        return;
      }

      const newMethodConfig = {
        paymentMethod: 'debitCard',
        isEnabled: true,
        displayName: 'New Test Method',
        displayOrder: 2,
        gatewayId: testGatewayId,
        supportedCurrencies: ['USD'],
      };

      const response = await client.post('/business/method-configs', newMethodConfig, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('paymentMethodConfigId');
      expect(response.data.data).toHaveProperty('displayName', newMethodConfig.displayName);

      // Clean up - delete the new method config
      const newMethodConfigId = response.data.data.paymentMethodConfigId;
      await client.delete(`/business/method-configs/${newMethodConfigId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should update an existing method configuration', async () => {
      if (!testMethodConfigId) {
        return;
      }

      const updates = {
        displayName: 'Updated Method Name',
        isEnabled: false,
      };

      const response = await client.put(`/business/method-configs/${testMethodConfigId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('displayName', updates.displayName);

      // Reset to original values
      await client.put(
        `/business/method-configs/${testMethodConfigId}`,
        {
          displayName: testMethodConfigData.displayName,
          isEnabled: testMethodConfigData.isEnabled,
        },
        {
          headers: { Authorization: `Bearer ${adminToken}` },
        },
      );
    });
  });

  describe('Authorization Tests', () => {
    it('should require authentication for method config operations', async () => {
      const response = await client.get('/business/method-configs');
      expect(response.status).toBe(401);
    });
  });
});
