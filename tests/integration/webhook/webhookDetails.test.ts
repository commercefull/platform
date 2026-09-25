/**
 * Webhook Management Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by webhook.test.ts:
 * - GET /business/webhooks/events
 * - POST /business/webhooks (register)
 * - PUT /business/webhooks/:webhookEndpointId
 * - POST /business/webhooks/:webhookEndpointId/test
 * - DELETE /business/webhooks/:webhookEndpointId
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';

const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Webhook Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let endpointId: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
  });

  it('GET /business/webhooks/events lists available events', async () => {
    const resp = await client.get('/business/webhooks/events', auth());
    expectStatus(resp, 200);
    expect(resp.data.data !== undefined).toBe(true);
  });

  it('POST /business/webhooks registers a webhook', async () => {
    const resp = await client.post(
      '/business/webhooks',
      { name: 'Coverage Hook', url: 'https://example.com/hook', events: ['order.created'] },
      auth(),
    );
    expectStatus(resp, 201);
    endpointId = resp.data.data.webhookEndpointId || resp.data.data.id;
    expect(endpointId).toBeTruthy();
  });

  it('PUT /business/webhooks/:id updates the webhook', async () => {
    const resp = await client.put(`/business/webhooks/${endpointId}`, { name: 'Coverage Hook v2' }, auth());
    expectStatus(resp, 200);
    expect(resp.data.data.name).toBe('Coverage Hook v2');
  });

  it('POST /business/webhooks/:id/test fires a test delivery', async () => {
    const resp = await client.post(`/business/webhooks/${endpointId}/test`, {}, auth());
    // The endpoint always responds 200; the delivery outcome is inside data
    expectStatus(resp, 200);
    expect(resp.data.data.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('DELETE /business/webhooks/:id unregisters the webhook', async () => {
    const resp = await client.delete(`/business/webhooks/${endpointId}`, auth());
    expectStatus(resp, 200);

    const get = await client.get(`/business/webhooks/${endpointId}`, auth());
    expectStatus(get, 404);
  });

  it('PUT /business/webhooks/:id errors on unknown ids', async () => {
    const resp = await client.put(`/business/webhooks/${UNKNOWN_ID}`, { name: 'x' }, auth());
    expectStatus(resp, 404);
    expect(resp.data.success).toBe(false);
  });
});
