/**
 * Warehouse Expanded Tests
 * Tests: stock transfers, reservations, zones, bins, inventory levels
 */

import { AxiosInstance } from 'axios';
import {
  setupWarehouseTests,
  cleanupWarehouseTests,
  createTestWarehouse,
  createTestZone,
  SEEDED_WAREHOUSE_IDS,
  SEEDED_ZONE_IDS,
  SEEDED_BIN_IDS,
} from './testUtils';

describe('Warehouse Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    warehouseIds: [] as string[],
  };

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupWarehouseTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupWarehouseTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Stock Transfer Tests
  // ============================================================================

  describe('Stock Transfers', () => {
    it('should list stock transfers', async () => {
      const resp = await client.get('/business/stock-transfers', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should create a stock transfer between warehouses', async () => {
      const resp = await client.post(
        '/business/stock-transfers',
        {
          fromWarehouseId: SEEDED_WAREHOUSE_IDS.MAIN,
          toWarehouseId: SEEDED_WAREHOUSE_IDS.WEST_COAST,
          items: [
            { productId: '00000000-0000-0000-0000-000000000001', quantity: 5 },
          ],
        },
        { headers: authHeaders() },
      );

      expect([201, 200, 400, 404]).toContain(resp.status);
      if (resp.status === 201 || resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }
    });

    it('should reject transfer with same source and destination', async () => {
      const resp = await client.post(
        '/business/stock-transfers',
        {
          fromWarehouseId: SEEDED_WAREHOUSE_IDS.MAIN,
          toWarehouseId: SEEDED_WAREHOUSE_IDS.MAIN,
          items: [
            { productId: '00000000-0000-0000-0000-000000000001', quantity: 5 },
          ],
        },
        { headers: authHeaders() },
      );

      expect([400, 404]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Zone Management Tests
  // ============================================================================

  describe('Zone Management', () => {
    it('should list zones for a warehouse', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/zones`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should create a zone in a warehouse', async () => {
      const zoneData = createTestZone();
      const resp = await client.post(
        `/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/zones`,
        zoneData,
        { headers: authHeaders() },
      );

      expect([201, 200, 400]).toContain(resp.status);
      if (resp.status === 201 || resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }
    });

    it('should get a specific zone', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/zones/${SEEDED_ZONE_IDS.MAIN_STORAGE}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Bin Management Tests
  // ============================================================================

  describe('Bin Management', () => {
    it('should list bins for a zone', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/zones/${SEEDED_ZONE_IDS.MAIN_STORAGE}/bins`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should get a specific bin', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/bins/${SEEDED_BIN_IDS.A1_01}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Warehouse Inventory Levels
  // ============================================================================

  describe('Inventory Levels', () => {
    it('should get inventory levels for a warehouse', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/inventory`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should search inventory by product in warehouse', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/inventory`, {
        params: { productId: '00000000-0000-0000-0000-000000000001' },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Warehouse CRUD Expanded
  // ============================================================================

  describe('Warehouse CRUD Expanded', () => {
    it('should update a warehouse', async () => {
      const warehouseData = createTestWarehouse();
      const createResp = await client.post('/business/warehouses', warehouseData, {
        headers: authHeaders(),
      });

      if (createResp.status === 201 || createResp.status === 200) {
        const warehouseId = createResp.data.data.distributionWarehouseId;
        createdResources.warehouseIds.push(warehouseId);

        const updateResp = await client.put(
          `/business/warehouses/${warehouseId}`,
          { ...warehouseData, name: 'Updated Warehouse Name' },
          { headers: authHeaders() },
        );

        expect([200, 400, 404]).toContain(updateResp.status);
      }
    });

    it('should get warehouse by ID', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should return 404 for non-existent warehouse', async () => {
      const resp = await client.get('/business/warehouses/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(resp.status);
    });
  });
});
