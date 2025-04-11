import { AxiosInstance } from 'axios';
import { setupPaymentTests, cleanupPaymentTests, testGateway } from './testUtils';

describe('Payment Gateway Tests', () => {
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

  describe('Admin Gateway Operations', () => {
    it('should get all gateways for a merchant', async () => {
      const response = await client.get(`/api/admin/merchants/${testGateway.merchantId}/gateways`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Check that the test gateway is included in the results
      const foundGateway = response.data.data.find((g: any) => g.id === testGatewayId);
      expect(foundGateway).toBeDefined();
      expect(foundGateway.name).toBe(testGateway.name);
      expect(foundGateway.provider).toBe(testGateway.provider);
    });

    it('should get a gateway by ID', async () => {
      const response = await client.get(`/api/admin/gateways/${testGatewayId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testGatewayId);
      expect(response.data.data).toHaveProperty('name', testGateway.name);
      expect(response.data.data).toHaveProperty('provider', testGateway.provider);
      expect(response.data.data).toHaveProperty('isActive', testGateway.isActive);
      
      // Verify sensitive data handling
      expect(response.data.data).toHaveProperty('apiKey'); // Key should be present but may be masked
      expect(response.data.data.apiKey).not.toBe(testGateway.apiSecret); // Secrets should never be returned fully
    });

    it('should create a new payment gateway', async () => {
      const newGateway = {
        name: 'New Test Gateway',
        provider: 'paypal',
        isActive: true,
        apiKey: 'new_test_api_key',
        apiSecret: 'new_test_api_secret',
        sandboxMode: true,
        merchantId: testGateway.merchantId
      };
      
      const response = await client.post('/api/admin/gateways', newGateway, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('name', newGateway.name);
      expect(response.data.data).toHaveProperty('provider', newGateway.provider);
      
      // Clean up - delete the new gateway
      const newGatewayId = response.data.data.id;
      await client.delete(`/api/admin/gateways/${newGatewayId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update an existing gateway', async () => {
      const updates = {
        name: 'Updated Gateway Name',
        isActive: false
      };
      
      const response = await client.put(`/api/admin/gateways/${testGatewayId}`, updates, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testGatewayId);
      expect(response.data.data).toHaveProperty('name', updates.name);
      expect(response.data.data).toHaveProperty('isActive', updates.isActive);
      
      // Reset to original values for other tests
      await client.put(`/api/admin/gateways/${testGatewayId}`, {
        name: testGateway.name,
        isActive: testGateway.isActive
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should reject gateway operations for unauthorized users', async () => {
      // Try to get gateways with customer token
      const response = await client.get(`/api/admin/merchants/${testGateway.merchantId}/gateways`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(403);
      expect(response.data.success).toBe(false);
    });
  });
});
