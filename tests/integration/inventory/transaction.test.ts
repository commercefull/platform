import { AxiosInstance } from 'axios';
import { setupInventoryTests, cleanupInventoryTests } from './testUtils';

describe('Inventory Transaction Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;
  let testLocationId: string;
  let testInventoryItemId: string;
  let testTransactionId: string;

  beforeAll(async () => {
    const setup = await setupInventoryTests();
    client = setup.client;
    adminToken = setup.adminToken;
    testProductId = setup.testProductId;
    testLocationId = setup.testLocationId;
    testInventoryItemId = setup.testInventoryItemId;
  });

  afterAll(async () => {
    await cleanupInventoryTests(client, adminToken, testInventoryItemId, testLocationId);
  });

  describe('Transaction Operations', () => {
    it('should create a restock transaction', async () => {
      const transaction = {
        inventoryId: testInventoryItemId,
        transactionType: 'restock',
        quantity: 50,
        reference: 'PO-12345',
        notes: 'Restock test transaction',
        createdBy: 'test-admin'
      };

      const response = await client.post('/api/admin/inventory/transactions', transaction, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      expect(response.data.data).toHaveProperty('inventoryId', testInventoryItemId);
      expect(response.data.data).toHaveProperty('transactionType', 'restock');
      expect(response.data.data).toHaveProperty('quantity', 50);
      
      // Save transaction ID for later tests
      testTransactionId = response.data.data.id;
    });

    it('should increase inventory quantity after restock transaction', async () => {
      // Get the updated inventory item
      const inventoryResponse = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Original quantity was set to 8 in inventory.test.ts, then we added 50
      expect(inventoryResponse.data.data.quantity).toBe(58);
    });

    it('should create an adjustment transaction', async () => {
      const transaction = {
        inventoryId: testInventoryItemId,
        transactionType: 'adjustment',
        quantity: -10, // Negative quantity represents reduction
        reference: 'ADJ-12345',
        notes: 'Adjustment for damaged items',
        createdBy: 'test-admin'
      };

      const response = await client.post('/api/admin/inventory/transactions', transaction, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('quantity', -10);
    });

    it('should decrease inventory quantity after adjustment transaction', async () => {
      // Get the updated inventory item
      const inventoryResponse = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      // Should be 58 - 10 = 48
      expect(inventoryResponse.data.data.quantity).toBe(48);
    });

    it('should get transaction history for an inventory item', async () => {
      const response = await client.get(`/api/admin/inventory/items/${testInventoryItemId}/transactions`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThanOrEqual(2); // At least our 2 test transactions
      
      // Transactions should be sorted by createdAt in descending order
      const transactions = response.data.data;
      if (transactions.length >= 2) {
        const createdAt1 = new Date(transactions[0].createdAt).getTime();
        const createdAt2 = new Date(transactions[1].createdAt).getTime();
        expect(createdAt1).toBeGreaterThanOrEqual(createdAt2);
      }
    });

    it('should get transaction by ID', async () => {
      const response = await client.get(`/api/admin/inventory/transactions/${testTransactionId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testTransactionId);
      expect(response.data.data).toHaveProperty('inventoryId', testInventoryItemId);
      expect(response.data.data).toHaveProperty('transactionType', 'restock');
    });

    it('should search transactions by reference', async () => {
      const response = await client.get('/api/admin/inventory/transactions', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { reference: 'PO-12345' }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // All returned transactions should have the reference
      response.data.data.forEach((transaction: any) => {
        expect(transaction.reference).toBe('PO-12345');
      });
    });
  });
});
