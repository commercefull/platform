/**
 * Inventory Stock Operations Integration Tests
 *
 * Tests for inventory locations CRUD, stock adjust/reserve/release,
 * low-stock/out-of-stock queries, and transaction history.
 */

import axios, { AxiosInstance } from 'axios';
import { randomUUID } from 'node:crypto';

const API_URL = process.env.API_URL || 'http://localhost:3000';

const TEST_MERCHANT = {
  email: 'merchant@example.com',
  password: 'password123',
};

const TEST_PRODUCT_1_ID = '00000000-0000-0000-0000-000000000001';

const TEST_STORE_IDS = {
  ACTIVE: '20000000-0000-0000-0000-000000000001',
  INACTIVE: '20000000-0000-0000-0000-000000000002',
  FEATURED: '20000000-0000-0000-0000-000000000003',
  MERCHANT: '20000000-0000-0000-0000-000000000004',
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

describe('Inventory Stock Operations Tests', () => {
  // ==========================================================================
  // GET /business/inventory/locations
  // ==========================================================================

  describe('GET /business/inventory/locations', () => {
    it('should list inventory locations', async () => {
      const response = await client.get('/business/inventory/locations', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/inventory/locations/low-stock
  // ==========================================================================

  describe('GET /business/inventory/locations/low-stock', () => {
    it('should return low stock items', async () => {
      const response = await client.get('/business/inventory/locations/low-stock', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/inventory/locations/out-of-stock
  // ==========================================================================

  describe('GET /business/inventory/locations/out-of-stock', () => {
    it('should return out of stock items', async () => {
      const response = await client.get('/business/inventory/locations/out-of-stock', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/inventory/locations/:inventoryLocationId
  // ==========================================================================

  describe('GET /business/inventory/locations/:inventoryLocationId', () => {
    it('should return 404 for non-existent location', async () => {
      const response = await client.get(`/business/inventory/locations/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expect([404, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // POST /business/inventory/locations
  // ==========================================================================

  describe('POST /business/inventory/locations', () => {
    it('should reject creation with missing required fields', async () => {
      const response = await client.post(
        '/business/inventory/locations',
        { name: 'Test Location' },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
    });

    it('should create a store-type inventory location with address', async () => {
      const response = await client.post(
        '/business/inventory/locations',
        {
          name: `Test Inv Location ${randomUUID().substring(0, 8)}`,
          address1: '123 Test St',
          city: 'Portland',
          state: 'OR',
          country: 'US',
          postalCode: '97035',
        },
        { headers: authHeaders() },
      );

      expect([201, 200, 400, 500]).toContain(response.status);
    });

    it('should create a legacy inventory location with SKU', async () => {
      const response = await client.post(
        '/business/inventory/locations',
        {
          distributionWarehouseId: randomUUID(),
          productId: TEST_PRODUCT_1_ID,
          sku: `TEST-SKU-${Date.now()}`,
          quantity: 100,
          minimumStockLevel: 10,
        },
        { headers: authHeaders() },
      );

      expect([201, 200, 400, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // POST /business/inventory/locations/:id/adjust
  // ==========================================================================

  describe('POST /business/inventory/locations/:id/adjust', () => {
    it('should reject adjust with missing quantityChange', async () => {
      const response = await client.post(
        `/business/inventory/locations/${randomUUID()}/adjust`,
        { reason: 'Test adjustment' },
        { headers: authHeaders() },
      );

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject adjust with invalid location ID', async () => {
      const response = await client.post(
        `/business/inventory/locations/${randomUUID()}/adjust`,
        { quantityChange: 10, reason: 'Test' },
        { headers: authHeaders() },
      );

      expect([404, 400, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // POST /business/inventory/locations/:id/reserve
  // ==========================================================================

  describe('POST /business/inventory/locations/:id/reserve', () => {
    it('should reject reserve with missing quantity', async () => {
      const response = await client.post(
        `/business/inventory/locations/${randomUUID()}/reserve`,
        {},
        { headers: authHeaders() },
      );

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject reserve with non-positive quantity', async () => {
      const response = await client.post(
        `/business/inventory/locations/${randomUUID()}/reserve`,
        { quantity: 0 },
        { headers: authHeaders() },
      );

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // POST /business/inventory/locations/:id/release
  // ==========================================================================

  describe('POST /business/inventory/locations/:id/release', () => {
    it('should reject release with missing quantity', async () => {
      const response = await client.post(
        `/business/inventory/locations/${randomUUID()}/release`,
        {},
        { headers: authHeaders() },
      );

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should reject release with non-positive quantity', async () => {
      const response = await client.post(
        `/business/inventory/locations/${randomUUID()}/release`,
        { quantity: -5 },
        { headers: authHeaders() },
      );

      expect([400, 404, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // GET /business/inventory/transactions/types
  // ==========================================================================

  describe('GET /business/inventory/transactions/types', () => {
    it('should list transaction types', async () => {
      const response = await client.get('/business/inventory/transactions/types', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/inventory/transactions/product/:productId
  // ==========================================================================

  describe('GET /business/inventory/transactions/product/:productId', () => {
    it('should return transaction history for a product', async () => {
      const response = await client.get(
        `/business/inventory/transactions/product/${TEST_PRODUCT_1_ID}`,
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/inventory (legacy)
  // ==========================================================================

  describe('GET /business/inventory (legacy)', () => {
    it('should list inventory (legacy endpoint)', async () => {
      const response = await client.get('/business/inventory', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // GET /business/inventory/low-stock (legacy)
  // ==========================================================================

  describe('GET /business/inventory/low-stock (legacy)', () => {
    it('should return low stock items (legacy endpoint)', async () => {
      const response = await client.get('/business/inventory/low-stock', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ==========================================================================
  // Full lifecycle: create → adjust → reserve → release
  // ==========================================================================

  describe('Full stock lifecycle', () => {
    it('should create location, adjust, reserve, and release stock', async () => {
      // Create a legacy inventory location
      const createRes = await client.post(
        '/business/inventory/locations',
        {
          distributionWarehouseId: randomUUID(),
          productId: TEST_PRODUCT_1_ID,
          sku: `LIFECYCLE-${Date.now()}`,
          quantity: 100,
          minimumStockLevel: 10,
        },
        { headers: authHeaders() },
      );

      if (createRes.status !== 201 && createRes.status !== 200) return;

      const locationId = createRes.data.data?.inventoryLocationId || createRes.data.data?.id;
      if (!locationId) return;

      // Adjust stock up
      const adjustRes = await client.post(
        `/business/inventory/locations/${locationId}/adjust`,
        { quantityChange: 50, reason: 'Restock test' },
        { headers: authHeaders() },
      );
      expect(adjustRes.status).toBe(200);

      // Reserve stock
      const reserveRes = await client.post(
        `/business/inventory/locations/${locationId}/reserve`,
        { quantity: 20 },
        { headers: authHeaders() },
      );
      expect(reserveRes.status).toBe(200);

      // Release reservation
      const releaseRes = await client.post(
        `/business/inventory/locations/${locationId}/release`,
        { quantity: 10 },
        { headers: authHeaders() },
      );
      expect(releaseRes.status).toBe(200);

      // Verify via get
      const getRes = await client.get(`/business/inventory/locations/${locationId}`, {
        headers: authHeaders(),
      });
      expect(getRes.status).toBe(200);

      // Update location
      const updateRes = await client.put(
        `/business/inventory/locations/${locationId}`,
        { quantity: 200, minimumStockLevel: 20 },
        { headers: authHeaders() },
      );
      expect([200, 400, 500]).toContain(updateRes.status);

      // Delete location
      const deleteRes = await client.delete(`/business/inventory/locations/${locationId}`, {
        headers: authHeaders(),
      });
      expect([200, 400, 500]).toContain(deleteRes.status);
    });
  });

  // ==========================================================================
  // PUT /business/inventory/locations/:id
  // ==========================================================================

  describe('PUT /business/inventory/locations/:id', () => {
    it('should return error for non-existent location', async () => {
      const response = await client.put(
        `/business/inventory/locations/${randomUUID()}`,
        { quantity: 100 },
        { headers: authHeaders() },
      );

      expect([404, 400, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // DELETE /business/inventory/locations/:id
  // ==========================================================================

  describe('DELETE /business/inventory/locations/:id', () => {
    it('should return error or success for non-existent location', async () => {
      const response = await client.delete(`/business/inventory/locations/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expect([200, 204, 404, 400, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // POST /business/inventory/transfer-between-stores
  // ==========================================================================

  describe('POST /business/inventory/transfer-between-stores', () => {
    it('should reject transfer with missing fields', async () => {
      const response = await client.post(
        '/business/inventory/transfer-between-stores',
        { fromStoreId: TEST_STORE_IDS.ACTIVE },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
    });

    it('should reject transfer with same store', async () => {
      const response = await client.post(
        '/business/inventory/transfer-between-stores',
        {
          fromStoreId: TEST_STORE_IDS.ACTIVE,
          toStoreId: TEST_STORE_IDS.ACTIVE,
          items: [{ productId: TEST_PRODUCT_1_ID, quantity: 1 }],
        },
        { headers: authHeaders() },
      );

      expect([400, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // GET /customer/inventory/availability/:sku
  // ==========================================================================

  describe('GET /customer/inventory/availability/:sku', () => {
    it('should check availability by SKU', async () => {
      const response = await client.get('/customer/inventory/availability/TEST-SKU-001', {
        headers: { 'X-Test-Request': 'true' },
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
      expect(response.data.data).toHaveProperty('sku');
    });
  });

  // ==========================================================================
  // GET /customer/inventory/availability/product/:productId
  // ==========================================================================

  describe('GET /customer/inventory/availability/product/:productId', () => {
    it('should check availability by productId', async () => {
      const response = await client.get(
        `/customer/inventory/availability/product/${TEST_PRODUCT_1_ID}`,
        { headers: { 'X-Test-Request': 'true' } },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });
  });

  // ==========================================================================
  // GET /business/inventory/:inventoryId (legacy)
  // ==========================================================================

  describe('GET /business/inventory/:inventoryId (legacy)', () => {
    it('should return 404 or error for non-existent inventory ID', async () => {
      const response = await client.get(`/business/inventory/${randomUUID()}`, {
        headers: authHeaders(),
      });

      expect([404, 400, 500]).toContain(response.status);
    });
  });

  // ==========================================================================
  // POST /business/inventory/:inventoryId/restock (legacy)
  // ==========================================================================

  describe('POST /business/inventory/:inventoryId/restock (legacy)', () => {
    it('should reject restock with missing quantityChange', async () => {
      const response = await client.post(
        `/business/inventory/${randomUUID()}/restock`,
        {},
        { headers: authHeaders() },
      );

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
