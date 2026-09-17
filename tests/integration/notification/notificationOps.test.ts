/**
 * Notification Operations Integration Tests
 *
 * Covers endpoints not exercised by the other notification suites:
 * - GET    /business/notifications/batches/:batchId                    — get batch
 * - POST   /business/notifications/webhooks                            — create webhook
 * - DELETE /business/notifications/webhooks/:webhookId                 — deactivate webhook
 * - GET    /business/notifications/templates/:templateId/translations  — list translations
 * - POST   /business/notifications/templates/:templateId/translations  — upsert translation
 * - POST   /customer/notifications/devices                             — register device
 * - DELETE /customer/notifications/devices/:deviceToken                — deactivate device
 */

import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin, expectStatus } from '../testUtils';
import { loginTestUser } from './testUtils';

// Seeded in seeds/20240805001215_seedTestNotification.js
const SEEDED_BATCH_ID = '00000000-0000-0000-0000-000000000101';
const SEEDED_WEBHOOK_ID = '00000000-0000-0000-0000-000000000102';
const SEEDED_TEMPLATE_ID = '00000000-0000-0000-0000-000000000103';

describe('Notification Operations Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;

  const adminHeaders = () => ({ Authorization: `Bearer ${adminToken}` });
  const customerHeaders = () => ({ Authorization: `Bearer ${customerToken}` });

  beforeAll(async () => {
    jest.setTimeout(30000);
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client);
    if (!adminToken) throw new Error('Failed to get admin token for Notification tests');
  });

  // ============================================================================
  // Batches
  // ============================================================================

  describe('Batches', () => {
    it('should get a seeded batch by ID', async () => {
      const getResponse = await client.get(`/business/notifications/batches/${SEEDED_BATCH_ID}`, { headers: adminHeaders() });
      expectStatus(getResponse, 200);
      expect(getResponse.data.success).toBe(true);
    });

    it('should return 404 for a non-existent batch', async () => {
      const response = await client.get('/business/notifications/batches/00000000-0000-0000-0000-000000000000', {
        headers: adminHeaders(),
      });
      expectStatus(response, 404);
    });
  });

  // ============================================================================
  // Webhooks
  // ============================================================================

  describe('Webhooks', () => {
    it('should create a webhook', async () => {
      const createResponse = await client.post(
        '/business/notifications/webhooks',
        { url: 'https://example.com/webhook-ops', events: ['notification.sent'] },
        { headers: adminHeaders() },
      );
      expectStatus(createResponse, 201);
      expect(createResponse.data.data?.notificationWebhookId || createResponse.data.data?.id).toBeTruthy();
    });

    it('should deactivate the seeded webhook', async () => {
      const deleteResponse = await client.delete(`/business/notifications/webhooks/${SEEDED_WEBHOOK_ID}`, {
        headers: adminHeaders(),
      });
      expectStatus(deleteResponse, 200);
    });
  });

  // ============================================================================
  // Template Translations
  // ============================================================================

  describe('Template Translations', () => {
    it('should upsert a translation on the seeded template', async () => {
      const response = await client.post(
        `/business/notifications/templates/${SEEDED_TEMPLATE_ID}/translations`,
        { locale: 'es-ES', subject: 'Asunto de prueba', body: 'Cuerpo de prueba' },
        { headers: adminHeaders() },
      );
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });

    it('should list translations for the seeded template', async () => {
      const response = await client.get(`/business/notifications/templates/${SEEDED_TEMPLATE_ID}/translations`, {
        headers: adminHeaders(),
      });
      expectStatus(response, 200);
      expect(response.data.success).toBe(true);
    });
  });

  // ============================================================================
  // Devices (customer)
  // ============================================================================

  describe('Devices', () => {
    it('should register and deactivate a device', async () => {
      if (!customerToken) return;

      const deviceToken = `ops-device-${Date.now()}`;
      const registerResponse = await client.post(
        '/customer/notifications/devices',
        { deviceToken, platform: 'ios' },
        { headers: customerHeaders() },
      );
      expectStatus(registerResponse, 201);

      const deleteResponse = await client.delete(`/customer/notifications/devices/${deviceToken}`, { headers: customerHeaders() });
      expectStatus(deleteResponse, 200);
    });
  });
});
