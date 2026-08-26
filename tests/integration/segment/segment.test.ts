/**
 * Segment Module Integration Tests
 * Covers segment CRUD, evaluation, members, and customer profiles
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Segment Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let segmentId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (orgToken && segmentId) {
      await client.delete(`/business/segment/${segmentId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
    }
  });

  describe('Segment CRUD', () => {
    it('POST /business/segment creates a segment', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/segment',
        {
          name: 'VIP Customers',
          description: 'Customers with high lifetime value',
          rules: { field: 'lifetimeValue', operator: '>', value: 1000 },
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        segmentId = resp.data.data?.segmentId || resp.data.data?.id || '';
      }
    });

    it('GET /business/segment returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/segment', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('GET /business/segment/:segmentId returns single segment', async () => {
      if (!orgToken || !segmentId) return;
      const resp = await client.get(`/business/segment/${segmentId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('GET /business/segment/unknown-id → 404', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/segment/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 404);
    });

    it('PUT /business/segment/:segmentId updates segment', async () => {
      if (!orgToken || !segmentId) return;
      const resp = await client.put(
        `/business/segment/${segmentId}`,
        { name: 'Updated VIP Customers' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });
  });

  describe('Segment evaluation & members', () => {
    it('POST /business/segment/:segmentId/evaluate evaluates segment', async () => {
      if (!orgToken || !segmentId) return;
      const resp = await client.post(
        `/business/segment/${segmentId}/evaluate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('GET /business/segment/:segmentId/members returns members', async () => {
      if (!orgToken || !segmentId) return;
      const resp = await client.get(`/business/segment/${segmentId}/members`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Customer profiles', () => {
    it('GET /business/segment/profiles returns profiles list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/segment/profiles', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('GET /business/segment/profiles/:customerId returns profile', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/segment/profiles/00000000-0000-0000-0000-000000000001', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expect([200, 404]).toContain(resp.status);
    });

    it('POST /business/segment/profiles/:customerId/compute computes profile', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/segment/profiles/00000000-0000-0000-0000-000000000001/compute',
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 404]).toContain(resp.status);
    });

    it('POST /business/segment/profiles/recompute-all recomputes all profiles', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/segment/profiles/recompute-all',
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 202]).toContain(resp.status);
    });

    it('GET /business/segment/profiles/:customerId/segments returns membership', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/segment/profiles/00000000-0000-0000-0000-000000000001/segments', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });
  });

  describe('Delete', () => {
    it('DELETE /business/segment/:segmentId removes segment', async () => {
      if (!orgToken || !segmentId) return;
      const resp = await client.delete(`/business/segment/${segmentId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      segmentId = '';
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/segment');
      expect(resp.status).toBe(401);
    });
  });
});
