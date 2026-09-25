/**
 * Supplier Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by supplier.test.ts / supplierExpanded.test.ts /
 * supplierOps.test.ts:
 * - GET    /business/receiving/:id (happy path)
 * - GET    /business/purchase-orders/:id/receiving
 * - PUT    /business/receiving/:id
 * - GET    /business/receiving/:id/items
 * - PUT    /business/receiving-items/:id
 * - PUT    /business/purchase-order-items/:id
 * - DELETE /business/purchase-order-items/:id
 * - PUT    /business/supplier-products/:id
 * - DELETE /business/supplier-products/:id
 *
 * Fixtures come from 20240805002202_seedSupplierTestData.js.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

const SEEDED = {
  SUPPLIER_ID: '01938000-0000-7000-8000-000000000001', // ACME_CORP
  SUPPLIER_PRODUCT_ID: '01938002-0000-7000-8000-000000000001', // WIDGET_A
  SUPPLIER_PRODUCT_DELETE_ID: '01938002-0000-7000-8000-000000000002', // WIDGET_B
  PO_ID: '01938003-0000-7000-8000-000000000001', // PO_001 (ACME)
  PO_ITEM_ID: '01938004-0000-7000-8000-000000000001', // PO_001_ITEM_1
  PO_ITEM_DELETE_ID: '01938004-0000-7000-8000-000000000002', // PO_001_ITEM_2
  OPS_PO_ID: '01938005-0000-7000-8000-000000000001',
  RECEIVING_ID: '01938006-0000-7000-8000-000000000001',
  RECEIVING_ITEM_ID: '01938007-0000-7000-8000-000000000001',
};

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Supplier Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Receiving records', () => {
    it('GET /business/receiving/:id returns the seeded record', async () => {
      const resp = await client.get(`/business/receiving/${SEEDED.RECEIVING_ID}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.supplierReceivingRecordId).toBe(SEEDED.RECEIVING_ID);
      expect(resp.data.data.receiptNumber).toBe('SRR-OPS-001');
    });

    it('GET /business/purchase-orders/:id/receiving lists records for the PO', async () => {
      const resp = await client.get(`/business/purchase-orders/${SEEDED.OPS_PO_ID}/receiving`, auth());
      expectStatus(resp, 200);
      const records = resp.data.data as Array<Record<string, unknown>>;
      expect(Array.isArray(records)).toBe(true);
      expect(records.some(r => r.supplierReceivingRecordId === SEEDED.RECEIVING_ID)).toBe(true);
    });

    it('GET /business/purchase-orders/:id/receiving returns empty for a PO with none', async () => {
      const resp = await client.get(`/business/purchase-orders/${SEEDED.PO_ID}/receiving`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data).toHaveLength(0);
    });

    it('PUT /business/receiving/:id updates tracking fields', async () => {
      const resp = await client.put(
        `/business/receiving/${SEEDED.RECEIVING_ID}`,
        { carrierName: 'UPS Freight', trackingNumber: '1Z999AA10123456784', notes: 'Dock 4 delivery' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.carrierName).toBe('UPS Freight');
      expect(resp.data.data.trackingNumber).toBe('1Z999AA10123456784');
    });

    it('PUT /business/receiving/:id returns 404 for unknown record', async () => {
      const resp = await client.put(`/business/receiving/${UNKNOWN_ID}`, { notes: 'x' }, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Receiving items', () => {
    it('GET /business/receiving/:id/items lists seeded items', async () => {
      const resp = await client.get(`/business/receiving/${SEEDED.RECEIVING_ID}/items`, auth());
      expectStatus(resp, 200);
      const items = resp.data.data as Array<Record<string, unknown>>;
      expect(items.length).toBeGreaterThanOrEqual(2);
      expect(items.some(i => i.sku === 'OPS-SKU-ACCEPT')).toBe(true);
    });

    it('PUT /business/receiving-items/:id updates quantities', async () => {
      const resp = await client.put(
        `/business/receiving-items/${SEEDED.RECEIVING_ITEM_ID}`,
        { receivedQuantity: 5, rejectedQuantity: 1 },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.receivedQuantity).toBe(5);
      expect(resp.data.data.rejectedQuantity).toBe(1);
    });

    it('PUT /business/receiving-items/:id returns 404 for unknown item', async () => {
      const resp = await client.put(`/business/receiving-items/${UNKNOWN_ID}`, { receivedQuantity: 1 }, auth());
      expectStatus(resp, 404);
    });
  });

  describe('Purchase order items', () => {
    it('PUT /business/purchase-order-items/:id updates quantity and cost', async () => {
      const resp = await client.put(
        `/business/purchase-order-items/${SEEDED.PO_ITEM_ID}`,
        { quantity: 25, unitCostCents: 1500 },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.quantity).toBe(25);
      expect(resp.data.data.unitCostCents).toBe(1500);
    });

    it('PUT /business/purchase-order-items/:id returns 404 for unknown item', async () => {
      const resp = await client.put(`/business/purchase-order-items/${UNKNOWN_ID}`, { quantity: 1 }, auth());
      expectStatus(resp, 404);
    });

    it('DELETE /business/purchase-order-items/:id removes the item', async () => {
      const resp = await client.delete(`/business/purchase-order-items/${SEEDED.PO_ITEM_DELETE_ID}`, auth());
      expectStatus(resp, 200);

      const items = await client.get(`/business/purchase-orders/${SEEDED.PO_ID}/items`, auth());
      const list = items.data.data as Array<Record<string, unknown>>;
      expect(list.some(i => i.supplierPurchaseOrderItemId === SEEDED.PO_ITEM_DELETE_ID)).toBe(false);
    });
  });

  describe('Supplier products', () => {
    it('PUT /business/supplier-products/:id updates pricing fields', async () => {
      const resp = await client.put(
        `/business/supplier-products/${SEEDED.SUPPLIER_PRODUCT_ID}`,
        { unitCostCents: 1450, leadTime: 7 },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.unitCostCents).toBe(1450);
      expect(resp.data.data.leadTime).toBe(7);
    });

    it('PUT /business/supplier-products/:id returns 404 for unknown product', async () => {
      const resp = await client.put(`/business/supplier-products/${UNKNOWN_ID}`, { unitCostCents: 100 }, auth());
      expectStatus(resp, 404);
    });

    it('DELETE /business/supplier-products/:id removes the link', async () => {
      const resp = await client.delete(`/business/supplier-products/${SEEDED.SUPPLIER_PRODUCT_DELETE_ID}`, auth());
      expectStatus(resp, 200);

      const products = await client.get(`/business/suppliers/${SEEDED.SUPPLIER_ID}/products`, auth());
      const list = products.data.data as Array<Record<string, unknown>>;
      expect(list.some(p => p.supplierProductId === SEEDED.SUPPLIER_PRODUCT_DELETE_ID)).toBe(false);
    });
  });
});
