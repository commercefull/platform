/**
 * Warehouse Receiving + Pick/Pack Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by warehouse.test.ts / warehouseExpanded.test.ts /
 * warehouseOps.test.ts:
 * - POST/GET /business/warehouses/:id/receiving + GET :receivingId + complete
 * - POST/GET /business/warehouses/:id/pick-pack + lifecycle transitions
 *
 * Fixtures from seeds/20240805002100_seedWarehouseTestData.js.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';
import { SEEDED_WAREHOUSE_IDS } from './testUtils';

const WAREHOUSE_ID = SEEDED_WAREHOUSE_IDS.MAIN;

describe('Warehouse Receiving + Pick/Pack Details', () => {
  let client: AxiosInstance;
  let adminToken: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  describe('Receiving', () => {
    let receivingId: string;

    it('POST /business/warehouses/:id/receiving creates a receiving record', async () => {
      const resp = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/receiving`,
        { receiptNumber: `COV-${Date.now()}`, sourceType: 'purchase_order' },
        auth(),
      );
      expectStatus(resp, 201);
      receivingId = resp.data.data.warehouseReceivingId || resp.data.data.id;
      expect(receivingId).toBeTruthy();
    });

    it('GET /business/warehouses/:id/receiving lists receiving records', async () => {
      const resp = await client.get(`/business/warehouses/${WAREHOUSE_ID}/receiving`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /business/warehouses/:id/receiving/:receivingId returns the record', async () => {
      const resp = await client.get(`/business/warehouses/${WAREHOUSE_ID}/receiving/${receivingId}`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.receiptNumber).toContain('COV-');
    });

    it('POST /business/warehouses/:id/receiving/:receivingId/complete completes it', async () => {
      const resp = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/receiving/${receivingId}/complete`,
        { receivedBy: 'coverage-bot' },
        auth(),
      );
      expectStatus(resp, 200);
      expect(resp.data.data.status).toBe('completed');
    });

    it('POST /business/warehouses/:id/receiving requires receiptNumber and sourceType', async () => {
      const resp = await client.post(`/business/warehouses/${WAREHOUSE_ID}/receiving`, {}, auth());
      expectStatus(resp, 400);
    });
  });

  describe('Pick/Pack', () => {
    let pickPackId: string;

    it('POST /business/warehouses/:id/pick-pack creates a pick/pack record', async () => {
      const resp = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack`,
        { pickPackNumber: `PP-${Date.now()}` },
        auth(),
      );
      expectStatus(resp, 201);
      pickPackId = resp.data.data.warehousePickPackId || resp.data.data.id;
      expect(pickPackId).toBeTruthy();
    });

    it('GET /business/warehouses/:id/pick-pack lists pick/pack records', async () => {
      const resp = await client.get(`/business/warehouses/${WAREHOUSE_ID}/pick-pack`, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.length).toBeGreaterThanOrEqual(1);
    });

    it('POST .../start-picking starts picking', async () => {
      const resp = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${pickPackId}/start-picking`,
        {},
        auth(),
      );
      expectStatus(resp, 200);
    });

    it('POST .../complete-picking + start-packing transitions the record', async () => {
      const completePicking = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${pickPackId}/complete-picking`,
        {},
        auth(),
      );
      expectStatus(completePicking, 200);

      const startPacking = await client.post(
        `/business/warehouses/${WAREHOUSE_ID}/pick-pack/${pickPackId}/start-packing`,
        {},
        auth(),
      );
      expectStatus(startPacking, 200);
    });

    it('POST /business/warehouses/:id/pick-pack requires pickPackNumber', async () => {
      const resp = await client.post(`/business/warehouses/${WAREHOUSE_ID}/pick-pack`, {}, auth());
      expectStatus(resp, 400);
    });
  });
});
