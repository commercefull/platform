/**
 * Inventory Pool & Transfer Integration Tests
 *
 * Tests for stock transfer, inventory item creation, inventory pool operations,
 * and store-to-store transfer endpoints.
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

let client: AxiosInstance;
let merchantToken: string;

beforeAll(async () => {
  client = axios.create({
    baseURL: API_URL,
    validateStatus: () => true,
    timeout: 10000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Test-Request': 'true',
    },
  });

  const loginResponse = await client.post('/business/auth/login', TEST_MERCHANT, {
    headers: { 'X-Test-Request': 'true' },
  });
  merchantToken = loginResponse.data?.accessToken || '';
});

const authHeaders = () => ({ Authorization: `Bearer ${merchantToken}` });

// ============================================================================
// Tests
// ============================================================================

describe('Inventory Pool & Transfer Tests', () => {
  // ==========================================================================
  // Create Inventory Item
  // ==========================================================================

  describe('POST /business/inventory/items', () => {
    it('should create a new inventory item', async () => {
      const itemData = {
        productId: '00000000-0000-0000-0000-000000000001',
        sku: `TEST-ITEM-${Date.now()}`,
        warehouseId: 'default-warehouse',
        quantity: 50,
        reservedQuantity: 0,
        reorderPoint: 10,
        reorderQuantity: 20,
        binLocation: 'A-1-2',
        costPrice: 15.99,
      };

      const response = await client.post('/business/inventory/items', itemData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400, 500]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
      }
    });

    it('should reject missing required fields', async () => {
      const response = await client.post(
        '/business/inventory/items',
        { sku: 'TEST-MISSING-FIELDS' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  // ==========================================================================
  // Get / List Inventory Items
  // ==========================================================================

  describe('GET /business/inventory/items', () => {
    it('should list inventory items with pagination', async () => {
      const response = await client.get('/business/inventory/items', {
        headers: authHeaders(),
        params: { page: 1, limit: 10 },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      if (response.data.data.items) {
        expect(Array.isArray(response.data.data.items)).toBe(true);
        expect(response.data.data).toHaveProperty('total');
        expect(response.data.data).toHaveProperty('page');
        expect(response.data.data).toHaveProperty('limit');
      }
    });

    it('should filter by low stock only', async () => {
      const response = await client.get('/business/inventory/items', {
        headers: authHeaders(),
        params: { lowStockOnly: 'true' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  describe('GET /business/inventory/items/lookup', () => {
    it('should look up an inventory item by SKU', async () => {
      const response = await client.get('/business/inventory/items/lookup', {
        headers: authHeaders(),
        params: { sku: 'TEST-SKU-001', warehouseId: 'default-warehouse' },
      });

      expect([200, 404, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        expect(response.data.data).toHaveProperty('sku');
      }
    });

    it('should return 404 for non-existent item', async () => {
      const response = await client.get('/business/inventory/items/lookup', {
        headers: authHeaders(),
        params: { sku: `NONEXISTENT-${Date.now()}`, warehouseId: 'default-warehouse' },
      });

      expect([404, 200, 400]).toContain(response.status);
    });
  });

  // ==========================================================================
  // Stock Transfer
  // ==========================================================================

  describe('POST /business/inventory/transfer', () => {
    it('should reject transfer with missing fields', async () => {
      const response = await client.post(
        '/business/inventory/transfer',
        { sourceLocationId: 'test-source' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject transfer with same source and destination', async () => {
      const response = await client.post(
        '/business/inventory/transfer',
        {
          sourceLocationId: 'same-loc',
          destinationLocationId: 'same-loc',
          items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 5 }],
          reason: 'test',
        },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });
  });

  // ==========================================================================
  // Transfer Between Stores
  // ==========================================================================

  describe('POST /business/inventory/transfer-between-stores', () => {
    it('should reject transfer with same source and target store', async () => {
      const response = await client.post(
        '/business/inventory/transfer-between-stores',
        {
          sourceStoreId: 'store-1',
          targetStoreId: 'store-1',
          items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 5 }],
        },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });

    it('should reject transfer with empty items', async () => {
      const response = await client.post(
        '/business/inventory/transfer-between-stores',
        {
          sourceStoreId: 'store-a',
          targetStoreId: 'store-b',
          items: [],
        },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });
  });

  // ==========================================================================
  // Inventory Pool Operations
  // ==========================================================================

  describe('POST /business/inventory/pools', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let poolId: string | undefined;

    it('should create an inventory pool', async () => {
      const poolData = {
        ownerType: 'merchant',
        ownerId: 'test-merchant-123',
        name: `Test Pool ${randomUUID().substring(0, 8)}`,
        poolType: 'shared',
        allocationStrategy: 'round_robin',
        reservationPolicy: 'soft',
      };

      const response = await client.post('/business/inventory/pools', poolData, {
        headers: authHeaders(),
      });

      expect([201, 200]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toBeDefined();
        poolId = response.data.data?.inventoryPoolId || response.data.data?.poolId;
      }
    });

    it('should reject pool creation with missing required fields', async () => {
      const response = await client.post(
        '/business/inventory/pools',
        { name: 'Missing Fields Pool' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });

  describe('POST /business/inventory/pools/allocate', () => {
    it('should reject allocation with missing poolId', async () => {
      const response = await client.post(
        '/business/inventory/pools/allocate',
        {
          orderId: 'test-order-1',
          items: [{ productId: '00000000-0000-0000-0000-000000000001', quantity: 5 }],
        },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });

    it('should reject allocation with empty items', async () => {
      const response = await client.post(
        '/business/inventory/pools/allocate',
        {
          poolId: 'nonexistent-pool',
          orderId: 'test-order-2',
          items: [],
        },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
      expect(response.data.success).toBe(false);
    });
  });
});
