import { AxiosInstance } from 'axios';
import { setupPaymentTests, cleanupPaymentTests, testGatewayData } from './testUtils';

describe('Payment Gateway Tests', () => {
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
    await cleanupPaymentTests(
      client,
      adminToken,
      testGatewayId,
      testMethodConfigId
    );
  });

  describe('Admin Gateway Operations', () => {
    it('should get all gateways for a merchant', async () => {
      const response = await client.get('/business/gateways', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a gateway by ID', async () => {
      if (!testGatewayId) {
        
        return;
      }
      
      const response = await client.get(`/business/gateways/${testGatewayId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('paymentGatewayId');
      expect(response.data.data).toHaveProperty('name');
      expect(response.data.data).toHaveProperty('provider');
    });

    it('should create a new payment gateway', async () => {
      const newGateway = {
        name: 'New Test Gateway',
        provider: 'paypal',
        isActive: true,
        isTestMode: true,
        supportedPaymentMethods: 'creditCard'
      };
      
      const response = await client.post('/business/gateways', newGateway, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('paymentGatewayId');
      expect(response.data.data).toHaveProperty('name', newGateway.name);
      
      // Clean up - delete the new gateway
      const newGatewayId = response.data.data.paymentGatewayId;
      await client.delete(`/business/gateways/${newGatewayId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update an existing gateway', async () => {
      if (!testGatewayId) {
        
        return;
      }
      
      const updates = {
        name: 'Updated Gateway Name',
        isActive: false
      };
      
      const response = await client.put(`/business/gateways/${testGatewayId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('name', updates.name);
      
      // Reset to original values
      await client.put(`/business/gateways/${testGatewayId}`, {
        name: testGatewayData.name,
        isActive: testGatewayData.isActive
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should require authentication for gateway operations', async () => {
      const response = await client.get('/business/gateways');
      expect(response.status).toBe(401);
    });
  });
});
