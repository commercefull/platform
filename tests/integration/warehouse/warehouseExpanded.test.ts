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
import { expectStatus } from '../testUtils';

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
    it('should create a stock transfer between warehouses', async () => {
      const resp = await client.post(
        '/business/inventory/transfer',
        {
          sourceLocationId: SEEDED_WAREHOUSE_IDS.MAIN,
          destinationLocationId: SEEDED_WAREHOUSE_IDS.WEST_COAST,
          items: [
            { productId: '00000000-0000-0000-0000-000000000001', quantity: 5 },
          ],
        },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
      if (resp.status === 200 || resp.status === 201) {
        expect(resp.data.success).toBe(true);
      }
    });

    it('should reject transfer with same source and destination', async () => {
      const resp = await client.post(
        '/business/inventory/transfer',
        {
          sourceLocationId: SEEDED_WAREHOUSE_IDS.MAIN,
          destinationLocationId: SEEDED_WAREHOUSE_IDS.MAIN,
          items: [
            { productId: '00000000-0000-0000-0000-000000000001', quantity: 5 },
          ],
        },
        { headers: authHeaders() },
      );

      expectStatus(resp, 400);
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

      expectStatus(resp, 201);
      if (resp.status === 201 || resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }
    });

    it('should get a specific zone', async () => {
      const zoneData = createTestZone();
      const createResp = await client.post(
        `/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/zones`,
        zoneData,
        { headers: authHeaders() },
      );

      expectStatus(createResp, 201);
      const zoneId = createResp.data.data?.distributionWarehouseZoneId;
      expect(zoneId).toBeDefined();

      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/zones/${zoneId}`, {
        headers: authHeaders(),
      });

      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Bin Management Tests
  // ============================================================================

  describe('Bin Management', () => {
    it('should list bins for a warehouse', async () => {
      const resp = await client.get(`/business/warehouses/${SEEDED_WAREHOUSE_IDS.MAIN}/bins`, {
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
      const resp = await client.get(`/business/inventory`, {
        params: { distributionWarehouseId: SEEDED_WAREHOUSE_IDS.MAIN },
        headers: authHeaders(),
      });

      expectStatus(resp, 200);
      if (resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }
    });

    it('should search inventory by product in warehouse', async () => {
      const resp = await client.get(`/business/inventory`, {
        params: { distributionWarehouseId: SEEDED_WAREHOUSE_IDS.MAIN, productId: '00000000-0000-0000-0000-000000000001' },
        headers: authHeaders(),
      });

      expectStatus(resp, 200);
      if (resp.status === 200) {
        expect(resp.data.success).toBe(true);
      }
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

        expectStatus(updateResp, 200);
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

      expectStatus(resp, 404);
    });
  });
});
