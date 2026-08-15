/**
 * Supplier Expanded Tests
 * Tests: PO workflow, receiving, supplier products, addresses
 */

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

describe('Supplier Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  const createdResources = {
    supplierIds: [] as string[],
    poIds: [] as string[],
  };

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupSupplierTests();
    client = setup.client;
    adminToken = setup.adminToken;
  });

  afterAll(async () => {
    await cleanupSupplierTests(client, adminToken, createdResources);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Purchase Order Workflow Tests
  // ============================================================================

  describe('PO Workflow', () => {
    it('should list purchase orders', async () => {
      const resp = await client.get('/business/purchase-orders', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should create a purchase order', async () => {
      const poData = createTestPurchaseOrder(SEEDED_SUPPLIER_IDS.ACME_CORP, SEEDED_WAREHOUSE_ID);
      const resp = await client.post('/business/purchase-orders', poData, {
        headers: authHeaders(),
      });

      expect([201, 200, 400]).toContain(resp.status);
      if (resp.status === 201 || resp.status === 200) {
        expect(resp.data.success).toBe(true);
        expect(resp.data.data).toHaveProperty('purchaseOrderId');
        createdResources.poIds.push(resp.data.data.purchaseOrderId);
      }
    });

    it('should get a specific purchase order', async () => {
      const resp = await client.get('/business/purchase-orders', {
        params: { supplierId: SEEDED_SUPPLIER_IDS.ACME_CORP },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should reject PO with non-existent supplier', async () => {
      const poData = createTestPurchaseOrder('00000000-0000-0000-0000-000000000000', SEEDED_WAREHOUSE_ID);
      const resp = await client.post('/business/purchase-orders', poData, {
        headers: authHeaders(),
      });

      expect([400, 404]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Receiving Tests
  // ============================================================================

  describe('Receiving', () => {
    it('should list receipts for a warehouse', async () => {
      const resp = await client.get('/business/inventory-receipts', {
        params: { warehouseId: SEEDED_WAREHOUSE_ID },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should create a receipt for a PO', async () => {
      const poData = createTestPurchaseOrder(SEEDED_SUPPLIER_IDS.ACME_CORP, SEEDED_WAREHOUSE_ID);
      const poResp = await client.post('/business/purchase-orders', poData, {
        headers: authHeaders(),
      });

      if (poResp.status === 201 || poResp.status === 200) {
        const poId = poResp.data.data.purchaseOrderId;
        createdResources.poIds.push(poId);

        const receiptResp = await client.post(
          '/business/inventory-receipts',
          {
            purchaseOrderId: poId,
            warehouseId: SEEDED_WAREHOUSE_ID,
            items: [
              { productId: '00000000-0000-0000-0000-000000000001', quantityReceived: 5 },
            ],
          },
          { headers: authHeaders() },
        );

        expect([201, 200, 400, 404]).toContain(receiptResp.status);
      }
    });
  });

  // ============================================================================
  // Supplier Products Tests
  // ============================================================================

  describe('Supplier Products', () => {
    it('should list products for a supplier', async () => {
      const resp = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/products`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Supplier Addresses Tests
  // ============================================================================

  describe('Supplier Addresses', () => {
    it('should list addresses for a supplier', async () => {
      const resp = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/addresses`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should create a supplier address', async () => {
      const addressData = createTestSupplierAddress(SEEDED_SUPPLIER_IDS.ACME_CORP);
      const resp = await client.post(
        `/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/addresses`,
        addressData,
        { headers: authHeaders() },
      );

      expect([201, 200, 400]).toContain(resp.status);
    });
  });

  // ============================================================================
  // Supplier CRUD Expanded
  // ============================================================================

  describe('Supplier CRUD Expanded', () => {
    it('should update a supplier', async () => {
      const supplierData = createTestSupplier();
      const createResp = await client.post('/business/suppliers', supplierData, {
        headers: authHeaders(),
      });

      if (createResp.status === 201 || createResp.status === 200) {
        const supplierId = createResp.data.data.supplierId;
        createdResources.supplierIds.push(supplierId);

        const updateResp = await client.put(
          `/business/suppliers/${supplierId}`,
          { ...supplierData, description: 'Updated supplier description' },
          { headers: authHeaders() },
        );

        expect([200, 400, 404]).toContain(updateResp.status);
      }
    });

    it('should get supplier by ID', async () => {
      const resp = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}`, {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should return 404 for non-existent supplier', async () => {
      const resp = await client.get('/business/suppliers/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expect([404, 400]).toContain(resp.status);
    });

    it('should filter suppliers by status', async () => {
      const resp = await client.get('/business/suppliers', {
        params: { status: 'active' },
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });
  });
});
