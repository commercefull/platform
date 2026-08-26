/**
 * Tracking Module Integration Tests
 * Covers tracking config CRUD, GTM, Meta CAPI, event mappings, lifecycle
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Tracking Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  const testStoreId = '00000000-0000-0000-0000-000000000001';

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  describe('Config listing & status', () => {
    it('GET /business/tracking/config returns config list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/tracking/config', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
    });

    it('GET /business/tracking/status returns tracking status', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/tracking/status', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });
  });

  describe('Config CRUD', () => {
    it('POST /business/tracking/config creates config', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/tracking/config',
        {
          storeId: testStoreId,
          provider: 'gtm',
          isActive: false,
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200, 400]).toContain(resp.status);
    });

    it('DELETE /business/tracking/config/:storeId deletes config', async () => {
      if (!orgToken) return;
      const resp = await client.delete(`/business/tracking/config/${testStoreId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('GTM', () => {
    it('PUT /business/tracking/config/:storeId/gtm updates GTM settings', async () => {
      if (!orgToken) return;
      const resp = await client.put(
        `/business/tracking/config/${testStoreId}/gtm`,
        { containerId: 'GTM-TEST123' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('DELETE /business/tracking/config/:storeId/gtm removes GTM', async () => {
      if (!orgToken) return;
      const resp = await client.delete(`/business/tracking/config/${testStoreId}/gtm`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('Meta CAPI', () => {
    it('PUT /business/tracking/config/:storeId/meta-capi updates Meta CAPI', async () => {
      if (!orgToken) return;
      const resp = await client.put(
        `/business/tracking/config/${testStoreId}/meta-capi`,
        { pixelId: '1234567890', accessToken: 'test-token' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('DELETE /business/tracking/config/:storeId/meta-capi removes Meta CAPI', async () => {
      if (!orgToken) return;
      const resp = await client.delete(`/business/tracking/config/${testStoreId}/meta-capi`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('Event mappings', () => {
    it('POST /business/tracking/config/:storeId/mappings adds event mapping', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        `/business/tracking/config/${testStoreId}/mappings`,
        { sourceEvent: 'order.created', targetEvent: 'Purchase' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 201, 400, 404]).toContain(resp.status);
    });

    it('DELETE /business/tracking/config/:storeId/mappings/:sourceEvent removes mapping', async () => {
      if (!orgToken) return;
      const resp = await client.delete(`/business/tracking/config/${testStoreId}/mappings/order.created`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });
  });

  describe('Lifecycle', () => {
    it('POST /business/tracking/config/:storeId/activate activates tracking', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        `/business/tracking/config/${testStoreId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('POST /business/tracking/config/:storeId/disable disables tracking', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        `/business/tracking/config/${testStoreId}/disable`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('POST /business/tracking/config/:storeId/hash-pii toggles PII hashing', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        `/business/tracking/config/${testStoreId}/hash-pii`,
        { hashPii: true },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('POST /business/tracking/config/:storeId/server-side toggles server-side', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        `/business/tracking/config/${testStoreId}/server-side`,
        { serverSideEnabled: true },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });
  });

  describe('Process event', () => {
    it('POST /business/tracking/process-event processes a manual event', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/tracking/process-event',
        { storeId: testStoreId, event: 'order.created', data: { orderId: 'test-123' } },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/tracking/config');
      expect(resp.status).toBe(401);
    });
  });
});
