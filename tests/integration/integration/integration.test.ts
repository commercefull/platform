/**
 * Integration Module Integration Tests
 * Covers integration CRUD, credentials, subscriptions, and logs APIs
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';

describe('Integration Module Integration Tests', () => {
  let client: AxiosInstance;
  let orgToken: string;
  let integrationId: string;
  let credentialId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    client = createTestClient();
    orgToken = await loginTestAdmin(client);
  });

  afterAll(async () => {
    if (orgToken && integrationId) {
      await client.delete(`/business/integration/${integrationId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
    }
  });

  describe('Integration CRUD', () => {
    it('UC-INT-001 — POST /business/integration creates a new integration', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/integration',
        {
          name: 'Test Integration',
          provider: 'mailchimp',
          description: 'Test integration for marketing automation',
          webhookUrl: 'https://api.example.com/webhook',
          config: { listId: 'test-list-123' },
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 201);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('integrationId');
      expect(resp.data.data.provider).toBe('mailchimp');
      integrationId = resp.data.data.integrationId;
    });

    it('UC-INT-001 — POST /business/integration with missing name → 400', async () => {
      if (!orgToken) return;
      const resp = await client.post(
        '/business/integration',
        { provider: 'mailchimp' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 400);
    });

    it('UC-INT-002 — GET /business/integration returns list', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/integration', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.success).toBe(true);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });

    it('UC-INT-003 — GET /business/integration/:id returns integration', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.get(`/business/integration/${integrationId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      expect(resp.data.data.integrationId).toBe(integrationId);
    });

    it('UC-INT-003 — GET /business/integration/unknown-id → 404', async () => {
      if (!orgToken) return;
      const resp = await client.get('/business/integration/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 404);
    });

    it('UC-INT-004 — PUT /business/integration/:id updates integration', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.put(
        `/business/integration/${integrationId}`,
        { name: 'Updated Integration', description: 'Updated description' },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
      expect(resp.data.data.name).toBe('Updated Integration');
    });

    it('UC-INT-005 — POST /business/integration/:id/activate', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.post(
        `/business/integration/${integrationId}/activate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
      expect(resp.data.data.status).toBe('active');
    });

    it('UC-INT-006 — POST /business/integration/:id/deactivate', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.post(
        `/business/integration/${integrationId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
      expect(resp.data.data.status).toBe('inactive');
    });
  });

  describe('Credentials', () => {
    it('UC-INT-008 — POST /business/integration/:id/credentials adds credential', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.post(
        `/business/integration/${integrationId}/credentials`,
        {
          type: 'api_key',
          label: 'Production API Key',
          credentials: { apiKey: 'test-api-key-12345' },
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 201);
      expect(resp.data.data).toHaveProperty('credentialId');
      credentialId = resp.data.data.credentialId;
    });

    it('UC-INT-009 — GET /business/integration/:id/credentials returns list', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.get(`/business/integration/${integrationId}/credentials`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('UC-INT-009 — credentials response does not expose encrypted data', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.get(`/business/integration/${integrationId}/credentials`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      if (resp.status !== 200) return;
      const items = resp.data.data?.data || resp.data.data || [];
      items.forEach((item: Record<string, unknown>) => {
        expect(item).not.toHaveProperty('encryptedData');
        expect(item).not.toHaveProperty('iv');
        expect(item).not.toHaveProperty('authTag');
      });
    });

    it('UC-INT-011 — DELETE /business/integration/:id/credentials/:credentialId', async () => {
      if (!orgToken || !integrationId || !credentialId) return;
      const resp = await client.delete(
        `/business/integration/${integrationId}/credentials/${credentialId}`,
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });
  });

  describe('Event Subscriptions', () => {
    it('UC-INT-012 — POST /business/integration/:id/subscriptions creates subscription', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.post(
        `/business/integration/${integrationId}/subscriptions`,
        {
          eventType: 'order.created',
          targetAction: 'add_subscriber',
          description: 'Add customer to mailing list on order creation',
          payloadMapping: { email: 'customer.email', firstName: 'customer.firstName' },
        },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 201);
      expect(resp.data.data).toHaveProperty('subscriptionId');
      subscriptionId = resp.data.data.subscriptionId;
    });

    it('UC-INT-013 — GET /business/integration/:id/subscriptions returns list', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.get(`/business/integration/${integrationId}/subscriptions`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('UC-INT-014 — PUT /business/integration/:id/subscriptions/:subscriptionId', async () => {
      if (!orgToken || !integrationId || !subscriptionId) return;
      const resp = await client.put(
        `/business/integration/${integrationId}/subscriptions/${subscriptionId}`,
        { targetAction: 'update_contact', isActive: false },
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });

    it('UC-INT-015 — DELETE /business/integration/:id/subscriptions/:subscriptionId', async () => {
      if (!orgToken || !integrationId || !subscriptionId) return;
      const resp = await client.delete(
        `/business/integration/${integrationId}/subscriptions/${subscriptionId}`,
        { headers: { Authorization: `Bearer ${orgToken}` } },
      );
      expectStatus(resp, 200);
    });
  });

  describe('Logs', () => {
    it('UC-INT-016 — GET /business/integration/:id/logs returns list', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.get(`/business/integration/${integrationId}/logs`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      const items = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('Delete Integration', () => {
    it('UC-INT-007 — DELETE /business/integration/:id removes integration', async () => {
      if (!orgToken || !integrationId) return;
      const resp = await client.delete(`/business/integration/${integrationId}`, {
        headers: { Authorization: `Bearer ${orgToken}` },
      });
      expectStatus(resp, 200);
      integrationId = '';
    });
  });

  describe('Auth', () => {
    it('requests without auth token → 401', async () => {
      const resp = await client.get('/business/integration');
      expect(resp.status).toBe(401);
    });
  });
});
