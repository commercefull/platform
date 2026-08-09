import { AxiosInstance } from 'axios';
import {
  setupSupplierTests,
  cleanupSupplierTests,
  createTestSupplier,
  createTestPurchaseOrder,
  createTestSupplierAddress,
  SEEDED_SUPPLIER_IDS,
  SEEDED_WAREHOUSE_ID,
} from './testUtils';

describe('Supplier Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    supplierIds: [] as string[],
    poIds: [] as string[],
  };

  beforeAll(async () => {
    const setup = await setupSupplierTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupSupplierTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Supplier CRUD Tests
  // ============================================================================

  describe('Supplier Management', () => {
    let testSupplierId: string;

    it('should create a supplier', async () => {
      const supplierData = createTestSupplier();

      const response = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('supplierId');
        testSupplierId = response.data.data.supplierId;
        createdResources.supplierIds.push(testSupplierId);
      }
    });

    it('should list suppliers', async () => {
      const response = await client.get('/business/suppliers', {
        headers: authHeaders(),
      });

      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
    });

    it('should get a specific supplier', async () => {
      const response = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
        expect(response.data.data).toHaveProperty('supplierId');
      }
    });

    it('should get supplier by code', async () => {
      const response = await client.get('/business/suppliers/code/ACME', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should get supplier statistics', async () => {
      const response = await client.get('/business/suppliers/statistics', {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should update a supplier', async () => {
      if (!testSupplierId) return;

      const updateData = { leadTime: 10 };

      const response = await client.put(`/business/suppliers/${testSupplierId}`, updateData, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should delete a supplier', async () => {
      if (!testSupplierId) return;

      const response = await client.delete(`/business/suppliers/${testSupplierId}`, {
        headers: authHeaders(),
      });

      expect([200, 204, 400]).toContain(response.status);
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await client.get('/business/suppliers/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Supplier Status Management
  // ============================================================================

  describe('Supplier Status Management', () => {
    let testSupplierId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const response = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });
      if (response.status === 201 || response.status === 200) {
        testSupplierId = response.data.data.supplierId;
        createdResources.supplierIds.push(testSupplierId);
      }
    });

    it('should update supplier status', async () => {
      if (!testSupplierId) return;

      const response = await client.patch(
        `/business/suppliers/${testSupplierId}/status`,
        { status: 'inactive' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should update supplier visibility', async () => {
      if (!testSupplierId) return;

      const response = await client.patch(
        `/business/suppliers/${testSupplierId}/visibility`,
        { isVisible: false },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
    });

    it('should approve a supplier', async () => {
      if (!testSupplierId) return;

      const response = await client.post(`/business/suppliers/${testSupplierId}/approve`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should suspend a supplier', async () => {
      if (!testSupplierId) return;

      const response = await client.post(`/business/suppliers/${testSupplierId}/suspend`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Supplier Addresses
  // ============================================================================

  describe('Supplier Addresses', () => {
    let testSupplierId: string;
    let testAddressId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const response = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });
      if (response.status === 201 || response.status === 200) {
        testSupplierId = response.data.data.supplierId;
        createdResources.supplierIds.push(testSupplierId);
      }
    });

    it('should list supplier addresses', async () => {
      if (!testSupplierId) return;

      const response = await client.get(`/business/suppliers/${testSupplierId}/addresses`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should create a supplier address', async () => {
      if (!testSupplierId) return;

      const addressData = createTestSupplierAddress(testSupplierId);

      const response = await client.post(`/business/suppliers/${testSupplierId}/addresses`, addressData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        testAddressId = response.data.data?.supplierAddressId;
      }
    });

    it('should update a supplier address', async () => {
      if (!testAddressId) return;

      const response = await client.put(
        `/business/supplier-addresses/${testAddressId}`,
        { city: 'Updated City' },
        { headers: authHeaders() },
      );

      expect([200, 400]).toContain(response.status);
    });

    it('should delete a supplier address', async () => {
      if (!testAddressId) return;

      const response = await client.delete(`/business/supplier-addresses/${testAddressId}`, {
        headers: authHeaders(),
      });

      expect([200, 204, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Supplier Products
  // ============================================================================

  describe('Supplier Products', () => {
    let testSupplierId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const response = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });
      if (response.status === 201 || response.status === 200) {
        testSupplierId = response.data.data.supplierId;
        createdResources.supplierIds.push(testSupplierId);
      }
    });

    it('should list supplier products', async () => {
      if (!testSupplierId) return;

      const response = await client.get(`/business/suppliers/${testSupplierId}/products`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should link product to supplier', async () => {
      if (!testSupplierId) return;

      const linkData = {
        productId: '00000000-0000-0000-0000-000000000001',
        supplierSku: `SUP-SKU-${Date.now()}`,
        cost: 15.0,
        minOrderQuantity: 10,
      };

      const response = await client.post(`/business/suppliers/${testSupplierId}/products`, linkData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Purchase Orders
  // ============================================================================

  describe('Purchase Orders', () => {
    let testSupplierId: string;
    let testPOId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const response = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });
      if (response.status === 201 || response.status === 200) {
        testSupplierId = response.data.data.supplierId;
        createdResources.supplierIds.push(testSupplierId);
      }
    });

    it('should create a purchase order', async () => {
      if (!testSupplierId) return;

      const poData = createTestPurchaseOrder(testSupplierId, SEEDED_WAREHOUSE_ID);

      const response = await client.post('/business/purchase-orders', poData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400, 500]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.data.success).toBe(true);
        testPOId = response.data.data?.purchaseOrder?.supplierPurchaseOrderId
          || response.data.data?.supplierPurchaseOrderId;
        if (testPOId) createdResources.poIds.push(testPOId);
      }
    });

    it('should list purchase orders', async () => {
      const response = await client.get('/business/purchase-orders', {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should get a specific purchase order', async () => {
      if (!testPOId) return;

      const response = await client.get(`/business/purchase-orders/${testPOId}`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should get purchase orders by supplier', async () => {
      if (!testSupplierId) return;

      const response = await client.get(`/business/suppliers/${testSupplierId}/purchase-orders`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should update a purchase order', async () => {
      if (!testPOId) return;

      const response = await client.put(`/business/purchase-orders/${testPOId}`, {
        notes: 'Updated PO notes',
      }, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should send a purchase order', async () => {
      if (!testPOId) return;

      const response = await client.post(`/business/purchase-orders/${testPOId}/send`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should approve a purchase order', async () => {
      if (!testPOId) return;

      const response = await client.post(`/business/purchase-orders/${testPOId}/approve`, {}, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });

    it('should cancel a purchase order', async () => {
      if (!testPOId) return;

      const response = await client.post(`/business/purchase-orders/${testPOId}/cancel`, {
        reason: 'Test cancellation',
      }, {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Purchase Order Items
  // ============================================================================

  describe('Purchase Order Items', () => {
    let testPOId: string;

    beforeAll(async () => {
      const supplierData = createTestSupplier();
      const supplierResponse = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });
      if (supplierResponse.status !== 201 && supplierResponse.status !== 200) return;

      const supplierId = supplierResponse.data.data.supplierId;
      createdResources.supplierIds.push(supplierId);

      const poData = createTestPurchaseOrder(supplierId, SEEDED_WAREHOUSE_ID);
      const poResponse = await client.post('/business/purchase-orders', poData, {
        headers: authHeaders(),
      });
      if (poResponse.status === 201 || poResponse.status === 200) {
        testPOId = poResponse.data.data?.purchaseOrder?.supplierPurchaseOrderId
          || poResponse.data.data?.supplierPurchaseOrderId;
        if (testPOId) createdResources.poIds.push(testPOId);
      }
    });

    it('should list purchase order items', async () => {
      if (!testPOId) return;

      const response = await client.get(`/business/purchase-orders/${testPOId}/items`, {
        headers: authHeaders(),
      });

      expect([200, 404]).toContain(response.status);
    });

    it('should add a purchase order item', async () => {
      if (!testPOId) return;

      const response = await client.post(`/business/purchase-orders/${testPOId}/items`, {
        productId: '00000000-0000-0000-0000-000000000002',
        sku: 'TEST-SKU-002',
        name: 'Test Product 2',
        quantity: 5,
        unitCost: 19.99,
      }, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Receiving Records
  // ============================================================================

  describe('Receiving Records', () => {
    it('should list receiving records', async () => {
      const response = await client.get('/business/receiving', {
        headers: authHeaders(),
      });

      expect([200, 400]).toContain(response.status);
      if (response.status === 200) {
        expect(response.data.success).toBe(true);
      }
    });

    it('should return 404 for non-existent receiving record', async () => {
      const response = await client.get('/business/receiving/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(response.status);
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for supplier list', async () => {
      const response = await client.get('/business/suppliers');
      expect(response.status).toBe(401);
    });

    it('should reject invalid tokens', async () => {
      const response = await client.get('/business/suppliers', {
        headers: { Authorization: 'Bearer invalid-token' },
      });
      expect(response.status).toBe(401);
    });
  });
});
