/**
 * Supplier Receiving Operations Integration Tests
 *
 * Covers endpoints not exercised by supplier.test.ts / supplierExpanded.test.ts:
 * - POST /business/receiving/:id/complete
 * - POST /business/receiving/:id/items
 * - POST /business/receiving-items/:id/accept
 * - POST /business/receiving-items/:id/reject
 *
 * Fixtures come from 20240805002202_seedSupplierTestData.js.
 */

import { AxiosInstance } from 'axios';

import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

// Seeded fixture IDs (see seeds/20240805002202_seedSupplierTestData.js)
const SEEDED = {
  RECEIVING_ID: '01938006-0000-7000-8000-000000000001',
  ITEM_ACCEPT_ID: '01938007-0000-7000-8000-000000000001',
  ITEM_REJECT_ID: '01938007-0000-7000-8000-000000000002',
};

describe('Supplier Receiving Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const authHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  it('POST /business/receiving/:id/items adds a receiving item', async () => {
    const resp = await client.post(
      `/business/receiving/${SEEDED.RECEIVING_ID}/items`,
      { productId: '00000000-0000-0000-0000-000000000001', sku: 'TEST-SKU-002', name: 'Accept Item', receivedQuantity: 3 },
      { headers: authHeaders() },
    );
    expectStatus(resp, 201);
    expect(resp.data.data?.supplierReceivingItemId || resp.data.data?.id).toBeTruthy();
  });

  it('POST /business/receiving/:id/items validates required fields', async () => {
    const resp = await client.post(`/business/receiving/${SEEDED.RECEIVING_ID}/items`, { sku: 'ONLY-SKU' }, { headers: authHeaders() });
    expectStatus(resp, 400);
  });

  it('POST /business/receiving-items/:id/accept accepts an item', async () => {
    const resp = await client.post(`/business/receiving-items/${SEEDED.ITEM_ACCEPT_ID}/accept`, {}, { headers: authHeaders() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('POST /business/receiving-items/:id/reject rejects an item with reason', async () => {
    const resp = await client.post(
      `/business/receiving-items/${SEEDED.ITEM_REJECT_ID}/reject`,
      { reason: 'Damaged packaging' },
      { headers: authHeaders() },
    );
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });

  it('POST /business/receiving-items/:id/reject requires a reason', async () => {
    // ITEM_REJECT_ID was already rejected above; validation runs before state checks
    const resp = await client.post(`/business/receiving-items/${SEEDED.ITEM_ACCEPT_ID}/reject`, {}, { headers: authHeaders() });
    expectStatus(resp, 400);
  });

  it('POST /business/receiving-items/:id/accept returns 404 for unknown item', async () => {
    const resp = await client.post(
      '/business/receiving-items/00000000-0000-0000-0000-000000000000/accept',
      {},
      { headers: authHeaders() },
    );
    expectStatus(resp, 404);
  });

  it('POST /business/receiving/:id/complete completes the receipt', async () => {
    const resp = await client.post(`/business/receiving/${SEEDED.RECEIVING_ID}/complete`, {}, { headers: authHeaders() });
    expectStatus(resp, 200);
    expect(resp.data.success).toBe(true);
  });
});
