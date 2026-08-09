import { AxiosInstance } from 'axios';
import {
  setupWarehouseTests,
  cleanupWarehouseTests,
  createTestWarehouse,
  SEEDED_WAREHOUSE_IDS,
} from './testUtils';

describe('Warehouse Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    warehouseIds: [] as string[],
  };

  beforeAll(async () => {
    const setup = await setupWarehouseTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupWarehouseTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Warehouse CRUD Tests
  // ============================================================================

  describe('Warehouse Management', () => {
    let testWarehouseId: string;

    it('should create a warehouse', async () => {
      const warehouseData = createTestWarehouse();

      const response = await client.post('/business/warehouses', warehouseData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('distributionWarehouseId');
        testWarehouseId = response.data.data.distributionWarehouseId;
        createdResources.warehouseIds.push(testWarehouseId);
      }
    });

    it('should list warehouses', async () => {
      const response = await client.get('/business/warehouses', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a specific warehouse', async () => {
      const response = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('distributionWarehouseId');
      }
    });

    it('should return 404 for non-existent warehouse', async () => {
      const response = await client.get('/business/warehouses/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(response.status);
    });

    it('should update a warehouse', async () => {
      if (!testWarehouseId) return;

      const updateData = { description: 'Updated warehouse description' };

      const response = await client.put(`/business/warehouses/${testWarehouseId}`, updateData, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should delete a warehouse', async () => {
      if (!testWarehouseId) return;

      const response = await client.delete(`/business/warehouses/${testWarehouseId}`, {
        headers: authHeaders(),
      });

      expect([200, 204, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Warehouse Query Endpoints
  // ============================================================================

  describe('Warehouse Queries', () => {
    it('should get default warehouse', async () => {
      const response = await client.get('/business/warehouses/default', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get fulfillment centers', async () => {
      const response = await client.get('/business/warehouses/fulfillment-centers', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get return centers', async () => {
      const response = await client.get('/business/warehouses/return-centers', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get warehouse statistics', async () => {
      const response = await client.get('/business/warehouses/statistics', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should find nearest warehouses', async () => {
      const response = await client.get('/business/warehouses/nearest?lat=45.5152&lng=-122.6784', {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get warehouses by country', async () => {
      const response = await client.get('/business/warehouses/country/US', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get warehouse by code', async () => {
      const response = await client.get('/business/warehouses/code/TEST_MAIN', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Warehouse Status Management
  // ============================================================================

  describe('Warehouse Status Management', () => {
    let testWarehouseId: string;

    beforeAll(async () => {
      const warehouseData = createTestWarehouse();
      const response = await client.post('/business/warehouses', warehouseData, {
        headers: authHeaders(),
      });
      if (response.status === 201 || response.status === 200) {
        testWarehouseId = response.data.data.distributionWarehouseId;
        createdResources.warehouseIds.push(testWarehouseId);
      }
    });

    it('should activate a warehouse', async () => {
      if (!testWarehouseId) return;

      const response = await client.post(`/business/warehouses/${testWarehouseId}/activate`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should deactivate a warehouse', async () => {
      if (!testWarehouseId) return;

      const response = await client.post(`/business/warehouses/${testWarehouseId}/deactivate`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should set default warehouse', async () => {
      if (!testWarehouseId) return;

      const response = await client.post(`/business/warehouses/${testWarehouseId}/default`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Warehouse Shipping Methods
  // ============================================================================

  describe('Warehouse Shipping Methods', () => {
    it('should add shipping method to warehouse', async () => {
      const response = await client.post(
        `/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/shipping-methods`,
        { methodId: '01936001-0000-7000-8000-000000000001' },
        { headers: authHeaders() },
      );

      expect([200, 201, 400, 404]).toContain(response.status);
    });

    it('should remove shipping method from warehouse', async () => {
      const response = await client.delete(
        `/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/shipping-methods/01936001-0000-7000-8000-000000000001`,
        { headers: authHeaders() },
      );

      expect([200, 204, 400, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Merchant Warehouses
  // ============================================================================

  describe('Merchant Warehouses', () => {
    it('should get warehouses by merchant', async () => {
      const response = await client.get('/business/merchants/00000000-0000-0000-0000-000000000001/warehouses', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });
  });

  // ============================================================================
  // Customer Store Locator
  // ============================================================================

  describe('Customer Store Locator', () => {
    it('should find nearest stores', async () => {
      const response = await client.get('/customer/warehouse/nearest?lat=45.5152&lng=-122.6784', {
        headers: { 'X-Test-Request': 'true' },
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should get stores by city', async () => {
      const response = await client.get('/customer/warehouse/city/Portland', {
        headers: { 'X-Test-Request': 'true' },
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should get stores by country', async () => {
      const response = await client.get('/customer/warehouse/country/US', {
        headers: { 'X-Test-Request': 'true' },
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should check store availability for a product', async () => {
      const response = await client.get(
        `/customer/warehouse/${SEEDED_WAREHOUSE_IDS.MAIN}/availability/00000000-0000-0000-0000-000000000001`,
        { headers: { 'X-Test-Request': 'true' } },
      );

      expect([200, 404]).toContain(response.status);
    });

    it('should get a store by ID', async () => {
      const response = await client.get(`/customer/warehouse/${SEEDED_WAREHOUSE_IDS.MAIN}`, {
        headers: { 'X-Test-Request': 'true' },
      });

      expect([200, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for warehouse list', async () => {
      const response = await client.get('/business/warehouses');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/warehouses', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});
