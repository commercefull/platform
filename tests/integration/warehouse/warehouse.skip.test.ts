import { AxiosInstance } from 'axios';
import { setupWarehouseTests, cleanupWarehouseTests, createTestWarehouse, createTestZone } from './testUtils';

describe('Warehouse Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    warehouseIds: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupWarehouseTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupWarehouseTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Warehouse Management Tests (UC-WHS-001 to UC-WHS-005)
  // ============================================================================

  describe('Warehouse Management', () => {
    let testWarehouseId: string;

    it('UC-WHS-003: should create a warehouse', async () => {
      const warehouseData = createTestWarehouse();

      const response = await client.post('/business/warehouses', warehouseData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionWarehouseId');

      testWarehouseId = response.data.data.distributionWarehouseId;
      createdResources.warehouseIds.push(testWarehouseId);
    });

    it('UC-WHS-001: should list warehouses', async () => {
      const response = await client.get('/business/warehouses', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-WHS-002: should get a specific warehouse', async () => {
      const response = await client.get(`/business/warehouses/${testWarehouseId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionWarehouseId', testWarehouseId);
    });

    it('UC-WHS-004: should update a warehouse', async () => {
      const updateData = { description: 'Updated warehouse description' };

      const response = await client.put(`/business/warehouses/${testWarehouseId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Warehouse Zones Tests (UC-WHS-006 to UC-WHS-009)
  // ============================================================================

  // TODO: Zone endpoints not yet implemented
  describe.skip('Warehouse Zones', () => {
    let testWarehouseId: string;
    let testZoneId: string;

    beforeAll(async () => {
      const warehouseData = createTestWarehouse();
      const response = await client.post('/business/warehouses', warehouseData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testWarehouseId = response.data.data.distributionWarehouseId;
      createdResources.warehouseIds.push(testWarehouseId);
    });

    it('UC-WHS-007: should create a warehouse zone', async () => {
      const zoneData = createTestZone();

      const response = await client.post(`/business/warehouses/${testWarehouseId}/zones`, zoneData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionWarehouseZoneId');

      testZoneId = response.data.data.distributionWarehouseZoneId;
    });

    it('UC-WHS-006: should list warehouse zones', async () => {
      const response = await client.get(`/business/warehouses/${testWarehouseId}/zones`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-WHS-008: should update a warehouse zone', async () => {
      const updateData = { type: 'picking' };

      const response = await client.put(`/business/warehouses/${testWarehouseId}/zones/${testZoneId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Bin Locations Tests (UC-WHS-010 to UC-WHS-013)
  // ============================================================================

  // TODO: Bin endpoints not yet implemented
  describe.skip('Bin Locations', () => {
    let testWarehouseId: string;
    let testZoneId: string;
    let testBinId: string;

    beforeAll(async () => {
      const warehouseData = createTestWarehouse();
      const whResponse = await client.post('/business/warehouses', warehouseData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testWarehouseId = whResponse.data.data.distributionWarehouseId;
      createdResources.warehouseIds.push(testWarehouseId);

      const zoneData = createTestZone();
      const zoneResponse = await client.post(`/business/warehouses/${testWarehouseId}/zones`, zoneData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testZoneId = zoneResponse.data.data.distributionWarehouseZoneId;
    });

    it('UC-WHS-011: should create a bin location', async () => {
      const binData = {
        zoneId: testZoneId,
        code: `BIN-${Date.now()}`,
        aisle: 'A',
        rack: '1',
        shelf: '1',
        bin: '1'
      };

      const response = await client.post(`/business/warehouses/${testWarehouseId}/bins`, binData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('distributionWarehouseBinId');

      testBinId = response.data.data.distributionWarehouseBinId;
    });

    it('UC-WHS-010: should list bin locations', async () => {
      const response = await client.get(`/business/warehouses/${testWarehouseId}/bins`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-WHS-012: should update a bin location', async () => {
      const updateData = { shelf: '2' };

      const response = await client.put(`/business/warehouses/${testWarehouseId}/bins/${testBinId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Pick/Pack Tests (UC-WHS-016 to UC-WHS-020)
  // ============================================================================

  // TODO: Pick/Pack endpoints not yet implemented
  describe.skip('Pick/Pack Operations', () => {
    let testWarehouseId: string;

    beforeAll(async () => {
      const warehouseData = createTestWarehouse();
      const response = await client.post('/business/warehouses', warehouseData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testWarehouseId = response.data.data.distributionWarehouseId;
      createdResources.warehouseIds.push(testWarehouseId);
    });

    it('UC-WHS-016: should create a pick task', async () => {
      const pickData = {
        orderIds: ['order-001'],
        priority: 'high'
      };

      const response = await client.post(`/business/warehouses/${testWarehouseId}/pick-tasks`, pickData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
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
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect(response.status).toBe(401);
    });
  });
});
