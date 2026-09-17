import { AxiosInstance } from 'axios';
import { testMethodConfigData, SEEDED_GATEWAY_ID, SEEDED_METHOD_CONFIG_ID } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

describe('Payment Method Configuration Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testGatewayId: string;
  let testMethodConfigId: string;

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    testGatewayId = SEEDED_GATEWAY_ID;
    testMethodConfigId = SEEDED_METHOD_CONFIG_ID;
  });

  describe('Admin Method Config Operations', () => {
    it('should get all method configurations for a organization', async () => {
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
