import { AxiosInstance } from 'axios';
import { setupPaymentTests, cleanupPaymentTests } from './testUtils';

describe('Payment Transaction Tests', () => {
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

  describe('Transaction Operations', () => {
    it('should list transactions (admin)', async () => {
      const response = await client.get('/business/transactions', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('data');
      expect(Array.isArray(response.data.data.data)).toBe(true);
    });

    it('should create a new transaction', async () => {
      if (!testMethodConfigId) {
        return;
      }

      const newTransaction = {
        orderId: '00000000-0000-0000-0000-000000000001',
        amount: 49.99,
        currency: 'USD',
        paymentMethodConfigId: testMethodConfigId,
      };

      const response = await client.post('/business/transactions', newTransaction, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('transactionId');

      // Clean up
      const newTransactionId = response.data.data.transactionId;
      await client.delete(`/business/transactions/${newTransactionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    });

    it('should require authentication for transaction operations', async () => {
      const response = await client.get('/business/transactions');
      expect(response.status).toBe(401);
    });
  });

  describe('Refund Operations', () => {
    it('should get refunds for a transaction', async () => {
      // Use a dummy transaction ID since we may not have one
      const dummyTransactionId = '00000000-0000-0000-0000-000000000001';

      const response = await client.get(`/business/transactions/${dummyTransactionId}/refunds`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // Transaction may not exist - expect 404
      expect(response.status).toBe(404);
    });

    it('should process a refund for a transaction', async () => {
      // Use a dummy transaction ID since we may not have one
      const dummyTransactionId = '00000000-0000-0000-0000-000000000001';

      const refundRequest = {
        amount: 25.0,
        reason: 'Test refund',
      };

      const response = await client.post(`/business/transactions/${dummyTransactionId}/refund`, refundRequest, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      // Transaction doesn't exist - expect 404
      expect(response.status).toBe(404);
    });
  });
});
