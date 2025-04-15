import { AxiosInstance } from 'axios';
import { setupInventoryTests, cleanupInventoryTests, testInventoryItem } from './testUtils';

describe('Inventory Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let testProductId: string;
  let testLocationId: string;
  let testInventoryItemId: string;

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

  describe('Inventory Item CRUD Operations', () => {
    it('should get an inventory item by ID', async () => {
      const response = await client.get(`/api/admin/inventory/items/${testInventoryItemId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testInventoryItemId);
      expect(response.data.data).toHaveProperty('productId', testProductId);
      expect(response.data.data).toHaveProperty('locationId', testLocationId);
      expect(response.data.data).toHaveProperty('quantity', testInventoryItem.quantity);
    });

    it('should list inventory items with pagination', async () => {
      const response = await client.get('/api/admin/inventory/items', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { limit: 10, offset: 0 }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data).toHaveProperty('pagination');
      expect(response.data.pagination).toHaveProperty('limit', 10);
      expect(response.data.pagination).toHaveProperty('offset', 0);
    });

    it('should update an inventory item', async () => {
      const updateData = {
        quantity: 150,
        lowStockThreshold: 15
      };

      const response = await client.put(`/api/admin/inventory/items/${testInventoryItemId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('quantity', 150);
      expect(response.data.data).toHaveProperty('lowStockThreshold', 15);
      expect(response.data.data).toHaveProperty('availableQuantity', 150); // Since reservedQuantity is 0
    });

    it('should filter inventory items by location', async () => {
      const response = await client.get('/api/admin/inventory/items', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { locationId: testLocationId }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Ensure all returned items have the correct locationId
      response.data.data.forEach((item: any) => {
        expect(item.locationId).toBe(testLocationId);
      });
    });

    it('should get low stock items', async () => {
      // First update the item to have low stock
      await client.put(`/api/admin/inventory/items/${testInventoryItemId}`, {
        quantity: 8, // Below the lowStockThreshold of 15 from previous test
      }, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const response = await client.get('/api/admin/inventory/items', {
        headers: { Authorization: `Bearer ${adminToken}` },
        params: { lowStock: true }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // There should be at least one low stock item (our test item)
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Find our test item in the results
      const testItem = response.data.data.find((item: any) => item.id === testInventoryItemId);
      expect(testItem).toBeDefined();
      expect(testItem.quantity).toBeLessThanOrEqual(testItem.lowStockThreshold);
    });
  });
});
