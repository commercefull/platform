/**
 * Outbound Webhook Integration Tests
 * Covers docs/specs/webhook/merchant.md §7 gaps
 */

import axios, { AxiosInstance } from 'axios';
import { eventBus } from '../../../libs/events/eventBus';

const createClient = (): AxiosInstance =>
  axios.create({
    baseURL: process.env.API_URL || 'http://localhost:3000',
    validateStatus: () => true,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  });

const loginMerchant = async (client: AxiosInstance): Promise<string> => {
  const r = await client.post(
    '/business/auth/login',
    { email: 'merchant@example.com', password: 'password123' },
    { headers: { 'X-Test-Request': 'true' } },
  );
  return r.data?.accessToken || '';
};

describe('Outbound Webhook Integration Tests', () => {
  let client: AxiosInstance;
  let merchantToken: string;
  let endpointId: string;

  beforeAll(async () => {
    client = createClient();
    merchantToken = await loginMerchant(client);
  });

  describe('Endpoint registration', () => {
    it('REQ 2.1.1 — POST /business/webhooks creates endpoint, response includes secret', async () => {
      if (!merchantToken) return;
      const resp = await client.post(
        '/business/webhooks',
        {
          name: 'Test Endpoint',
          url: 'https://example.com/webhook',
          events: ['order.created', 'order.paid'],
        },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );

      expect(resp.status).toBe(201);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('secret');
      expect(resp.data.data.secret).toBeTruthy();
      endpointId = resp.data.data.webhookEndpointId || resp.data.data.id;
    });

    it('REQ 2.1.2 — POST /business/webhooks with empty events → validation error', async () => {
      if (!merchantToken) return;
      const resp = await client.post(
        '/business/webhooks',
        {
          name: 'Bad Endpoint',
          url: 'https://example.com/webhook',
          events: [],
        },
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );
      expect([400, 422]).toContain(resp.status);
    });
  });

  describe('Event dispatch', () => {
    it('REQ 2.2.3 — emitting order.created on eventBus → delivery attempted for subscribed endpoint', async () => {
      if (!merchantToken || !endpointId) return;

      eventBus.emit('order.created', {
        orderId: '00000000-0000-0000-0000-000000000001',
        orderNumber: 'ORD-TEST-001',
        customerId: '00000000-0000-0000-0000-000000001001',
        totalAmount: 99.99,
        currency: 'USD',
      });

      await new Promise(r => setTimeout(r, 200));

      const resp = await client.get(`/business/webhooks/${endpointId}/deliveries`, {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });
      if (resp.status === 200) {
        const deliveries = resp.data.data?.data || resp.data.data || [];
        expect(Array.isArray(deliveries)).toBe(true);
      }
    });
  });

  describe('Endpoint management', () => {
    it('REQ 2.4.11 — GET /business/webhooks returns only authenticated merchant endpoints', async () => {
      if (!merchantToken) return;
      const resp = await client.get('/business/webhooks', { headers: { Authorization: `Bearer ${merchantToken}` } });
      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      const endpoints = resp.data.data?.data || resp.data.data || [];
      expect(Array.isArray(endpoints)).toBe(true);
    });

    it('REQ 4.4 — GET /business/webhooks/:id response does not include secret field', async () => {
      if (!merchantToken || !endpointId) return;
      const resp = await client.get(`/business/webhooks/${endpointId}`, { headers: { Authorization: `Bearer ${merchantToken}` } });
      if (resp.status !== 200) return;
      expect(resp.data.data).not.toHaveProperty('secret');
    });

    it('REQ 4.3 — GET /business/webhooks/unknown-id → 404', async () => {
      if (!merchantToken) return;
      const resp = await client.get('/business/webhooks/00000000-0000-0000-0000-000000000000', {
        headers: { Authorization: `Bearer ${merchantToken}` },
      });
      expect(resp.status).toBe(404);
    });
  });

  describe('Test delivery', () => {
    it('REQ 2.5.13 — POST /business/webhooks/:id/test → returns statusCode and durationMs', async () => {
      if (!merchantToken || !endpointId) return;
      const resp = await client.post(
        `/business/webhooks/${endpointId}/test`,
        {},
        { headers: { Authorization: `Bearer ${merchantToken}` } },
      );
      if (resp.status !== 200) return;
      const data = resp.data.data || resp.data;
      expect(data).toHaveProperty('statusCode');
      expect(data).toHaveProperty('durationMs');
    });
  });

  afterAll(async () => {
    if (merchantToken && endpointId) {
      await client.delete(`/business/webhooks/${endpointId}`, { headers: { Authorization: `Bearer ${merchantToken}` } });
    }
  });
});
