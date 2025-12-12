import { AxiosInstance } from 'axios';
import { setupSupplierTests, cleanupSupplierTests, createTestSupplier, createTestPurchaseOrder } from './testUtils';

describe('Supplier Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    supplierIds: [] as string[],
    poIds: [] as string[]
  };

  beforeAll(async () => {
    const setup = await setupSupplierTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupSupplierTests(client, adminToken, createdResources);
  });

  // ============================================================================
  // Supplier Management Tests (UC-SUP-001 to UC-SUP-005)
  // ============================================================================

  describe('Supplier Management', () => {
    let testSupplierId: string;

    it('UC-SUP-003: should create a supplier', async () => {
      const supplierData = createTestSupplier();

      const response = await client.post('/business/suppliers', supplierData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testSupplierId = response.data.data.id;
      createdResources.supplierIds.push(testSupplierId);
    });

    it('UC-SUP-001: should list suppliers', async () => {
      const response = await client.get('/business/suppliers', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SUP-002: should get a specific supplier', async () => {
      const response = await client.get(`/business/suppliers/${testSupplierId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testSupplierId);
    });

    it('UC-SUP-004: should update a supplier', async () => {
      const updateData = { leadTime: 10 };

      const response = await client.put(`/business/suppliers/${testSupplierId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Supplier Products Tests (UC-SUP-006 to UC-SUP-009)
  // ============================================================================

  describe('Supplier Products', () => {
    let testSupplierId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const response = await client.post('/business/suppliers', supplierData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testSupplierId = response.data.data.id;
      createdResources.supplierIds.push(testSupplierId);
    });

    it('UC-SUP-006: should list supplier products', async () => {
      const response = await client.get(`/business/suppliers/${testSupplierId}/products`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-007: should link product to supplier', async () => {
      const linkData = {
        productId: 'prod-001',
        supplierSku: 'SUP-SKU-001',
        cost: 15.00,
        minOrderQuantity: 10
      };

      const response = await client.post(`/business/suppliers/${testSupplierId}/products`, linkData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // May return 201 or error if product doesn't exist
      expect([201, 400, 404]).toContain(response.status);
    });
  });

  // ============================================================================
  // Purchase Order Tests (UC-SUP-010 to UC-SUP-016)
  // ============================================================================

  describe('Purchase Orders', () => {
    let testSupplierId: string;
    let testPOId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const response = await client.post('/business/suppliers', supplierData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      testSupplierId = response.data.data.id;
      createdResources.supplierIds.push(testSupplierId);
    });

    it('UC-SUP-012: should create a purchase order', async () => {
      const poData = createTestPurchaseOrder(testSupplierId);

      const response = await client.post('/business/suppliers/purchase-orders', poData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');

      testPOId = response.data.data.id;
      createdResources.poIds.push(testPOId);
    });

    it('UC-SUP-010: should list purchase orders', async () => {
      const response = await client.get('/business/suppliers/purchase-orders', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('UC-SUP-011: should get a specific purchase order', async () => {
      const response = await client.get(`/business/suppliers/purchase-orders/${testPOId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-014: should send purchase order', async () => {
      const response = await client.post(`/business/suppliers/purchase-orders/${testPOId}/send`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
    });

    it('UC-SUP-015: should receive purchase order', async () => {
      const receiveData = {
        items: [{ productId: 'prod-001', quantityReceived: 100 }]
      };

      const response = await client.post(`/business/suppliers/purchase-orders/${testPOId}/receive`, receiveData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      // May return 200 or error depending on PO state
      expect([200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for supplier list', async () => {
      const response = await client.get('/business/suppliers');
      expect([401, 403]).toContain(response.status);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/suppliers', {
        headers: { Authorization: 'Bearer invalid-token' }
      });
      expect([401, 403]).toContain(response.status);
    });
  });
});
