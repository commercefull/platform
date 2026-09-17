/**
 * Warehouse Operations Integration Tests
 *
 * Covers endpoints not exercised by warehouse.test.ts / warehouseExpanded.test.ts:
 * - PUT    /business/warehouses/:id/zones/:zoneId                        — update zone
 * - DELETE /business/warehouses/:id/zones/:zoneId                        — delete zone
 * - POST   /business/warehouses/:id/bins                                 — create bin
 * - PUT    /business/warehouses/:id/bins/:binId                          — update bin
 * - DELETE /business/warehouses/:id/bins/:binId                          — delete bin
 * - POST   /business/warehouses/:id/receiving                            — create receiving record
 * - GET    /business/warehouses/:id/receiving/:receivingId               — get receiving record
 * - POST   /business/warehouses/:id/receiving/:receivingId/complete      — complete receiving
 * - POST   /business/warehouses/:id/pick-pack                            — create pick/pack
 * - GET    /business/warehouses/:id/pick-pack/:pickPackId                — get pick/pack
 * - POST   /business/warehouses/:id/pick-pack/:pickPackId/start-picking    — start picking
 * - POST   /business/warehouses/:id/pick-pack/:pickPackId/complete-picking — complete picking
 * - POST   /business/warehouses/:id/pick-pack/:pickPackId/start-packing    — start packing
 * - POST   /business/warehouses/:id/pick-pack/:pickPackId/complete-packing — complete packing
 * - POST   /business/warehouses/:id/pick-pack/:pickPackId/assign           — assign pick/pack
 *
 * Fixtures come from 20240805002100_seedWarehouseTestData.js.
 */

import { AxiosInstance } from 'axios';
import { SEEDED_WAREHOUSE_IDS } from './testUtils';
import { createTestClient, loginTestAdmin } from '../testUtils';

const WAREHOUSE_ID = SEEDED_WAREHOUSE_IDS.MAIN;

// Seeded fixture IDs (see seeds/20240805002100_seedWarehouseTestData.js)
const SEEDED = {
  ZONE_OPS: '0193b003-0000-7000-8000-000000000001',
  BIN_OPS: '0193b002-0000-7000-8000-000000000005',
  RECEIVING_OPS: '0193b004-0000-7000-8000-000000000001',
  PICK_PACK_OPS: '0193b005-0000-7000-8000-000000000001',
};

describe('Warehouse Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  // ============================================================================
  // Zone Update/Delete
  // ============================================================================

  describe('Zone Update/Delete', () => {
    it('should update a zone', async () => {
      const response = await client.put(
        `/business/warehouses/${WAREHOUSE_ID}/zones/${SEEDED.ZONE_OPS}`,
        { name: 'Updated Zone', sortOrder: 10 },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 when updating a non-existent zone', async () => {
      const response = await client.put(
        `/business/warehouses/${WAREHOUSE_ID}/zones/00000000-0000-0000-0000-000000000000`,
        { name: 'Nope' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(404);
    });

    it('should delete a zone', async () => {
      const response = await client.delete(`/business/warehouses/${WAREHOUSE_ID}/zones/${SEEDED.ZONE_OPS}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Bin CRUD
  // ============================================================================

  describe('Bin CRUD', () => {
    it('should create a bin', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/bins`,
        { locationCode: `BIN-${Date.now()}`, binType: 'storage', isPickable: true },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.distributionWarehouseBinId || response.data.data?.id).toBeTruthy();
    });

    it('should reject bin creation without required fields', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/bins`,
        { isPickable: true },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should update a bin', async () => {
      const response = await client.put(
        `/business/warehouses/${WAREHOUSE_ID}/bins/${SEEDED.BIN_OPS}`,
        { binType: 'picking', priority: 5 },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 when updating a non-existent bin', async () => {
      const response = await client.put(
        `/business/warehouses/${WAREHOUSE_ID}/bins/00000000-0000-0000-0000-000000000000`,
        { binType: 'picking' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(404);
    });

    it('should delete a bin', async () => {
      const response = await client.delete(`/business/warehouses/${WAREHOUSE_ID}/bins/${SEEDED.BIN_OPS}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Receiving
  // ============================================================================

  describe('Receiving', () => {
    it('should create a receiving record', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/receiving`,
        {
          receiptNumber: `RCV-${Date.now()}`,
          sourceType: 'purchase_order',
          carrierName: 'Test Carrier',
          packageCount: 2,
        },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.warehouseReceivingId || response.data.data?.id).toBeTruthy();
    });

    it('should reject receiving without required fields', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/receiving`,
        { carrierName: 'No Receipt' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should get a receiving record by ID', async () => {
      const response = await client.get(`/business/warehouses/${WAREHOUSE_ID}/receiving/${SEEDED.RECEIVING_OPS}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent receiving record', async () => {
      const response = await client.get(
        `/business/warehouses/${WAREHOUSE_ID}/receiving/00000000-0000-0000-0000-000000000000`,
        { headers: authHeaders() },
      );

      expect(response.status).toBe(404);
    });

    it('should complete a receiving record', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/receiving/${SEEDED.RECEIVING_OPS}/complete`,
        { receivedBy: 'test-worker' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data.status).toBe('completed');
    });
  });

  // ============================================================================
  // Pick/Pack Workflow
  // ============================================================================

  describe('Pick/Pack Workflow', () => {
    it('should create a pick/pack record', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack`,
        { pickPackNumber: `PP-${Date.now()}`, notes: 'Integration test pick/pack' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data?.warehousePickPackId || response.data.data?.id).toBeTruthy();
    });

    it('should reject pick/pack creation without pickPackNumber', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack`,
        { notes: 'Missing number' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should get a pick/pack record by ID', async () => {
      const response = await client.get(`/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}`, {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should assign a pick/pack record', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/assign`,
        { assignedTo: 'worker-001' },
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should reject assign without assignedTo', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/assign`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(400);
    });

    it('should start picking', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/start-picking`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should complete picking', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/complete-picking`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should start packing', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/start-packing`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should complete packing', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/complete-packing`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for state transitions on a completed record', async () => {
      const response = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${SEEDED.PICK_PACK_OPS}/start-picking`,
        {},
        { headers: authHeaders() },
      );

      expect(response.status).toBe(404);
    });
  });
});
