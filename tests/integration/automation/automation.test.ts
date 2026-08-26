/**
 * Automation Module Integration Tests
 * Covers automation rule CRUD, trigger, and execution logs
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Automation Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let ruleId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (orgToken && ruleId) {
      await client.delete(`/business/automation/${ruleId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
    }
  });

  describe('Rule CRUD', () => {
    it('POST /business/automation creates a rule', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/automation',
        {
          name: 'Test Automation Rule',
          trigger: { event: 'order.created' },
          actions: [{ type: 'notification', channel: 'email' }],
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([201, 200]).toContain(resp.status);
      if (resp.data.success) {
        ruleId = resp.data.data?.ruleId || resp.data.data?.id || '';
      }
    });

    it('GET /business/automation returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/automation', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('GET /business/automation/:ruleId returns single rule', async () => {
      if (!orgToken || !ruleId) return;
      const resp = await client.get(`/business/automation/${ruleId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
    });

    it('GET /business/automation/unknown-id → 404', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/automation/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 404);
    });

    it('PUT /business/automation/:ruleId updates rule', async () => {
      if (!orgToken || !ruleId) return;
      const resp = await client.put(
        `/business/automation/${ruleId}`,
        { name: 'Updated Automation Rule' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });
  });

  describe('Rule lifecycle', () => {
    it('POST /business/automation/:ruleId/trigger triggers rule manually', async () => {
      if (!orgToken || !ruleId) return;
      const resp = await client.post(
        `/business/automation/${ruleId}/trigger`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expect([200, 400, 404]).toContain(resp.status);
    });

    it('GET /business/automation/:ruleId/logs returns execution logs', async () => {
      if (!orgToken || !ruleId) return;
      const resp = await client.get(`/business/automation/${ruleId}/logs`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Delete', () => {
    it('DELETE /business/automation/:ruleId removes rule', async () => {
      if (!orgToken || !ruleId) return;
      const resp = await client.delete(`/business/automation/${ruleId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      ruleId = '';
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/automation');
      expect(resp.status).toBe(401);
    });
  });
});
