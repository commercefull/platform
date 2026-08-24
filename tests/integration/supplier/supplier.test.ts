import { AxiosInstance } from 'axios';
import {
  setupSupplierTests,
  createTestSupplier,
  createTestPurchaseOrder,
  createTestSupplierAddress,
  SEEDED_SUPPLIER_IDS,
  SEEDED_SUPPLIER_ADDRESS_IDS as _SEEDED_SUPPLIER_ADDRESS_IDS,
  SEEDED_PURCHASE_ORDER_IDS,
  SEEDED_WAREHOUSE_ID,
} from './testUtils';
import { expectStatus } from '../testUtils';

describe('Supplier Feature Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  beforeAll(async () => {
    const setup = await setupSupplierTests();
    client = setup.client;
    adminToken = setup.adminToken;
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

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('supplierId');
      testSupplierId = response.data.data.supplierId;
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

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('supplierId');
    });

    it('should get supplier by code', async () => {
      const response = await client.get('/business/suppliers/code/ACME', {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should get supplier statistics', async () => {
      const response = await client.get('/business/suppliers/statistics', {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should update a supplier', async () => {
      if (!testSupplierId) return;

      const updateData = { leadTime: 10 };

      const response = await client.put(`/business/suppliers/${testSupplierId}`, updateData, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should delete a supplier', async () => {
      if (!testSupplierId) return;

      const response = await client.delete(`/business/suppliers/${testSupplierId}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should return 404 for non-existent supplier', async () => {
      const response = await client.get('/business/suppliers/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Supplier Status Management
  // ============================================================================

  describe('Supplier Status Management', () => {
    it('should update supplier status', async () => {
      const response = await client.patch(
        `/business/suppliers/${SEEDED_SUPPLIER_IDS.QUALITY_GOODS}/status`,
        { status: 'inactive' },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should update supplier visibility', async () => {
      const response = await client.patch(
        `/business/suppliers/${SEEDED_SUPPLIER_IDS.QUALITY_GOODS}/visibility`,
        { isVisible: false },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
    });

    it('should approve a supplier', async () => {
      const response = await client.post(`/business/suppliers/${SEEDED_SUPPLIER_IDS.QUALITY_GOODS}/approve`, {}, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should suspend a supplier', async () => {
      const response = await client.post(`/business/suppliers/${SEEDED_SUPPLIER_IDS.QUALITY_GOODS}/suspend`, {}, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });
  });

  // ============================================================================
  // Supplier Addresses
  // ============================================================================

  describe('Supplier Addresses', () => {
    let testAddressId: string;

    it('should list supplier addresses', async () => {
      const response = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/addresses`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should create a supplier address', async () => {
      const addressData = createTestSupplierAddress(SEEDED_SUPPLIER_IDS.ACME_CORP);

      const response = await client.post(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/addresses`, addressData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
      testAddressId = response.data.data?.supplierAddressId;
    });

    it('should update a supplier address', async () => {
      if (!testAddressId) return;

      const response = await client.put(
        `/business/supplier-addresses/${testAddressId}`,
        { city: 'Updated City' },
        { headers: authHeaders() },
      );

      expectStatus(response, 200);
    });

    it('should delete a supplier address', async () => {
      if (!testAddressId) return;

      const response = await client.delete(`/business/supplier-addresses/${testAddressId}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });
  });

  // ============================================================================
  // Supplier Products
  // ============================================================================

  describe('Supplier Products', () => {
    it('should list supplier products', async () => {
      const response = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/products`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should link product to supplier', async () => {
      const linkData = {
        productId: '00000000-0000-0000-0000-000000000001',
        sku: `SUP-SKU-${Date.now()}`,
        unitCost: 15.0,
        minimumOrderQuantity: 10,
      };

      const response = await client.post(`/business/suppliers/${SEEDED_SUPPLIER_IDS.GLOBAL_PARTS}/products`, linkData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
    });
  });

  // ============================================================================
  // Purchase Orders
  // ============================================================================

  describe('Purchase Orders', () => {
    it('should create a purchase order', async () => {
      const poData = createTestPurchaseOrder(SEEDED_SUPPLIER_IDS.ACME_CORP, SEEDED_WAREHOUSE_ID);

      const response = await client.post('/business/purchase-orders', poData, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
      expect(response.data.success).toBe(true);
    });

    it('should list purchase orders', async () => {
      const response = await client.get('/business/purchase-orders', {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should get a specific purchase order', async () => {
      const response = await client.get(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_001}`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should get purchase orders by supplier', async () => {
      const response = await client.get(`/business/suppliers/${SEEDED_SUPPLIER_IDS.ACME_CORP}/purchase-orders`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should update a purchase order', async () => {
      const response = await client.put(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_002}`, {
        notes: 'Updated PO notes',
      }, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should send a purchase order', async () => {
      const response = await client.post(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_002}/send`, {}, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should approve a purchase order', async () => {
      const response = await client.post(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_002}/approve`, {}, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should cancel a purchase order', async () => {
      const response = await client.post(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_002}/cancel`, {
        reason: 'Test cancellation',
      }, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });
  });

  // ============================================================================
  // Purchase Order Items
  // ============================================================================

  describe('Purchase Order Items', () => {
    it('should list purchase order items', async () => {
      const response = await client.get(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_001}/items`, {
        headers: authHeaders(),
      });

      expectStatus(response, 200);
    });

    it('should add a purchase order item', async () => {
      const response = await client.post(`/business/purchase-orders/${SEEDED_PURCHASE_ORDER_IDS.PO_001}/items`, {
        productId: '00000000-0000-0000-0000-000000000002',
        sku: 'TEST-SKU-002',
        name: 'Test Product 2',
        quantity: 5,
        unitCost: 19.99,
      }, {
        headers: authHeaders(),
      });

      expectStatus(response, 201);
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

      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should return 404 for non-existent receiving record', async () => {
      const response = await client.get('/business/receiving/00000000-0000-0000-0000-000000000000', {
        headers: authHeaders(),
      });

      expectStatus(response, 404);
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
