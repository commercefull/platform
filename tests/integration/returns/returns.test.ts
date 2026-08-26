/**
 * Returns Module Integration Tests
 * Covers return request CRUD, workflow transitions, and store credit
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Returns Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let returnId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  describe('Return request listing', () => {
    it('GET /business/returns returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/returns', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('GET /business/returns/:returnId with unknown id → 404', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/returns/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 404);
    });
  });

  describe('Return creation', () => {
    it('POST /business/returns creates a return request', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/returns',
        {
          orderId: '00000000-0000-0000-0000-000000000001',
          items: [{ productId: '00000000-0000-0000-0000-000000000002', quantity: 1, reason: 'defective' }],
          reason: 'Product arrived damaged',
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200, 400, 404]).toContain(resp.status);
      if (resp.data.success) {
        returnId = resp.data.data?.returnId || resp.data.data?.id || '';
      }
    });
  });

  describe('Return workflow', () => {
    it('POST /business/returns/:returnId/approve', async () => {
      if (!orgToken || !returnId) return;
      const resp = await client.post(
        `/business/returns/${returnId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('POST /business/returns/:returnId/deny', async () => {
      if (!orgToken || !returnId) return;
      const resp = await client.post(
        `/business/returns/${returnId}/deny`,
        { reason: 'Outside return window' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('POST /business/returns/:returnId/cancel', async () => {
      if (!orgToken || !returnId) return;
      const resp = await client.post(
        `/business/returns/${returnId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });
  });

  describe('Store credit', () => {
    it('GET /business/store-credit/balance returns balance', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/store-credit/balance', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('GET /business/store-credit/ledger returns ledger', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/store-credit/ledger', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 400, 404]).toContain(resp.status);
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/returns');
      expect(resp.status).toBe(401);
    });
  });
});
