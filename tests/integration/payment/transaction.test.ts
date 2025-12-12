import { AxiosInstance } from 'axios';
import { setupPaymentTests, cleanupPaymentTests, testTransaction, testRefund } from './testUtils';

describe('Payment Transaction Tests', () => {
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

  describe('Transaction Operations', () => {
    it('should get a transaction by ID (admin)', async () => {
      const response = await client.get(`/business/transactions/${testTransactionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTransactionId);
      expect(response.data.data).toHaveProperty('amount', testTransaction.amount);
      expect(response.data.data).toHaveProperty('currency', testTransaction.currency);
      expect(response.data.data).toHaveProperty('customerId', testTransaction.customerId);
      expect(response.data.data).toHaveProperty('orderId', testTransaction.orderId);
      expect(response.data.data).toHaveProperty('methodConfigId');
      
      // Check that fields follow the naming convention: snake_case in DB, camelCase in response
      expect(response.data.data).toHaveProperty('createdAt');
      expect(response.data.data).toHaveProperty('updatedAt');
    });

    it('should get a transaction by ID (customer)', async () => {
      const response = await client.get(`/api/transactions/${testTransactionId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTransactionId);
      
      // Public API shouldn't expose certain admin-only details
      expect(response.data.data).not.toHaveProperty('gatewayResponse');
    });

    it('should get transactions for a customer', async () => {
      const response = await client.get(`/customer/${testTransaction.customerId}/transactions`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test transaction
      const foundTransaction = response.data.data.find((t: any) => t.id === testTransactionId);
      expect(foundTransaction).toBeDefined();
    });

    it('should get transactions for an order', async () => {
      const response = await client.get(`/business/orders/${testTransaction.orderId}/transactions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our test transaction
      const foundTransaction = response.data.data.find((t: any) => t.id === testTransactionId);
      expect(foundTransaction).toBeDefined();
    });

    it('should create a new transaction', async () => {
      const newTransaction = {
        ...testTransaction,
        amount: 49.99,
        methodConfigId: testMethodConfigId,
        orderId: 'test-order-id-456'
      };
      
      const response = await client.post('/api/transactions', newTransaction, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('amount', newTransaction.amount);
      expect(response.data.data).toHaveProperty('currency', newTransaction.currency);
      expect(response.data.data).toHaveProperty('orderId', newTransaction.orderId);
      
      // Verify that status is set for new transactions
      expect(response.data.data).toHaveProperty('status');
      
      // Clean up - only admin can delete transactions
      const newTransactionId = response.data.data.id;
      await client.delete(`/business/transactions/${newTransactionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update a transaction status (admin only)', async () => {
      const update = {
        status: 'paid'
      };
      
      const response = await client.put(`/business/transactions/${testTransactionId}`, update, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTransactionId);
      expect(response.data.data).toHaveProperty('status', update.status);
      
      // Customer should not be able to update transaction status
      const customerResponse = await client.put(`/api/transactions/${testTransactionId}`, update, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(customerResponse.status).toBe(403);
      expect(customerResponse.data.success).toBe(false);
    });
  });

  describe('Refund Operations', () => {
    let testRefundId: string;
    
    beforeAll(async () => {
      // Create a test refund
      const refund = {
        ...testRefund,
        transactionId: testTransactionId
      };
      
      const response = await client.post('/business/refunds', refund, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (!response.data.success) {
        throw new Error(`Failed to create test refund: ${response.data.error}`);
      }
      
      testRefundId = response.data.data.id;
    });
    
    afterAll(async () => {
      // Clean up the test refund
      if (testRefundId) {
        await client.delete(`/business/refunds/${testRefundId}`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      }
    });

    it('should get a refund by ID', async () => {
      const response = await client.get(`/business/refunds/${testRefundId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testRefundId);
      expect(response.data.data).toHaveProperty('amount', testRefund.amount);
      expect(response.data.data).toHaveProperty('reason', testRefund.reason);
      expect(response.data.data).toHaveProperty('transactionId', testTransactionId);
      
      // Check for status field
      expect(response.data.data).toHaveProperty('status');
    });

    it('should get refunds for a transaction', async () => {
      const response = await client.get(`/business/transactions/${testTransactionId}/refunds`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Should find our test refund
      const foundRefund = response.data.data.find((r: any) => r.id === testRefundId);
      expect(foundRefund).toBeDefined();
    });

    it('should update a refund status', async () => {
      const update = {
        status: 'completed'
      };
      
      const response = await client.put(`/business/refunds/${testRefundId}`, update, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testRefundId);
      expect(response.data.data).toHaveProperty('status', update.status);
    });

    it('should let customers view their refunds', async () => {
      const response = await client.get(`/api/transactions/${testTransactionId}/refunds`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our test refund
      const foundRefund = response.data.data.find((r: any) => r.id === testRefundId);
      expect(foundRefund).toBeDefined();
      
      // Public API shouldn't expose admin-only details
      expect(foundRefund).not.toHaveProperty('gatewayResponse');
    });

    it('should allow customers to request refunds', async () => {
      const refundRequest = {
        amount: 25.00,
        reason: 'Partial refund request',
        transactionId: testTransactionId
      };
      
      const response = await client.post('/api/refunds', refundRequest, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      // Depending on your business logic, this might create a pending refund that requires admin approval
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('status', 'pending'); // Customer requests typically start as pending
      
      // Clean up the customer-requested refund
      const customerRefundId = response.data.data.id;
      await client.delete(`/business/refunds/${customerRefundId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });
  });
});
