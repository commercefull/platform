/**
 * Notification Detail Endpoints Integration Tests
 *
 * Covers endpoints missed by notification.test.ts / notificationExpanded.test.ts /
 * notificationOps.test.ts / preference.test.ts / template.test.ts:
 *
 * Business (organization JWT — userId = organizationId):
 * - GET /business/notifications/count, /unread, /recent
 * - PUT /business/notifications/:id/read, /read-all
 * - POST /business/notifications/:id/send
 * - GET /business/notifications/batches (list — previously hardcoded [])
 * - GET/POST /business/notifications/webhooks
 *
 * Customer:
 * - GET /customer/notifications/count
 * - GET/POST/DELETE /customer/notifications/devices
 * - PUT /customer/notifications/:id/read, PUT /customer/notifications/read
 *
 * Regression: business notification read endpoints previously 401'd for every
 * caller because they read req.user.id, which the organization JWT does not
 * carry — now falls back to req.user.organizationId.
 */

import { AxiosInstance } from 'axios';
import { expectStatus, createTestClient, loginTestAdmin } from '../testUtils';
import { loginTestUser } from './testUtils';
import { TEST_CUSTOMER_ID } from '../testConstants';

const ORGANIZATION_ID = '01911000-0000-7000-8000-000000000001';
const UNKNOWN_ID = '00000000-0000-0000-0000-000000099999';

describe('Notification Detail Endpoints', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let customerId: string;

  const auth = () => ({ headers: { Authorization: `Bearer ${adminToken}` } });
  const customerAuth = () => ({ headers: { Authorization: `Bearer ${customerToken}` } });

  const createNotification = (userId: string, overrides: Record<string, unknown> = {}) =>
    client.post(
      '/business/notifications',
      {
        userId,
        userType: 'organization',
        type: 'order_confirmation',
        title: 'Coverage notification',
        content: 'Endpoint coverage test',
        channel: 'in_app',
        ...overrides,
      },
      auth(),
    );

  beforeAll(async () => {
    client = createTestClient();
    adminToken = await loginTestAdmin(client);
    customerToken = await loginTestUser(client);
    customerId = JSON.parse(Buffer.from(customerToken.split('.')[1], 'base64url').toString()).id;
  });

  describe('Business read surface', () => {
    let orgNotificationId: string;

    it('POST /business/notifications creates a notification for the org user', async () => {
      const resp = await createNotification(ORGANIZATION_ID);
      expectStatus(resp, 201);
      orgNotificationId = resp.data.data.notificationId;
      expect(orgNotificationId).toBeTruthy();
    });

    it('GET /business/notifications/count returns the unread count for the org', async () => {
      const resp = await client.get('/business/notifications/count', auth());
      expectStatus(resp, 200);
      expect(resp.data.data.count).toBeGreaterThanOrEqual(1);
    });

    it('GET /business/notifications/unread lists unread notifications', async () => {
      const resp = await client.get('/business/notifications/unread', auth());
      expectStatus(resp, 200);
      const ids = resp.data.data.map((n: { notificationId: string }) => n.notificationId);
      expect(ids).toContain(orgNotificationId);
    });

    it('GET /business/notifications/recent lists recent notifications', async () => {
      const resp = await client.get('/business/notifications/recent', auth());
      expectStatus(resp, 200);
      const ids = resp.data.data.map((n: { notificationId: string }) => n.notificationId);
      expect(ids).toContain(orgNotificationId);
    });

    it('POST /business/notifications/:id/send marks the notification as sent', async () => {
      const resp = await client.post(`/business/notifications/${orgNotificationId}/send`, {}, auth());
      expectStatus(resp, 200);
    });

    it('POST /business/notifications/:id/send returns 404 for unknown id', async () => {
      const resp = await client.post(`/business/notifications/${UNKNOWN_ID}/send`, {}, auth());
      expectStatus(resp, 404);
    });

    it('PUT /business/notifications/:id/read marks it read', async () => {
      const resp = await client.put(`/business/notifications/${orgNotificationId}/read`, {}, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.isRead).toBe(true);
    });

    it('PUT /business/notifications/:id/read rejects another user\'s notification', async () => {
      const other = await createNotification(TEST_CUSTOMER_ID, { userType: 'customer' });
      expectStatus(other, 201);
      const otherId = other.data.data.notificationId;

      const resp = await client.put(`/business/notifications/${otherId}/read`, {}, auth());
      expectStatus(resp, 403);
    });

    it('PUT /business/notifications/:id/read returns 404 for unknown id', async () => {
      const resp = await client.put(`/business/notifications/${UNKNOWN_ID}/read`, {}, auth());
      expectStatus(resp, 404);
    });

    it('PUT /business/notifications/read-all marks all org notifications read', async () => {
      await createNotification(ORGANIZATION_ID);
      const resp = await client.put('/business/notifications/read-all', {}, auth());
      expectStatus(resp, 200);
      expect(resp.data.data.count).toBeGreaterThanOrEqual(1);

      const unread = await client.get('/business/notifications/unread', auth());
      expectStatus(unread, 200);
      expect(unread.data.data.length).toBe(0);
    });
  });

  describe('Batches and webhooks', () => {
    it('POST /business/notifications/batches creates a batch', async () => {
      const resp = await client.post(
        '/business/notifications/batches',
        {
          title: 'Coverage batch',
          channel: 'in_app',
          type: 'order_confirmation',
          content: 'Batch body',
          recipients: [{ userId: TEST_CUSTOMER_ID, userType: 'customer' }],
        },
        auth(),
      );
      expectStatus(resp, 201);
    });

    it('GET /business/notifications/batches lists created batches', async () => {
      const resp = await client.get('/business/notifications/batches', auth());
      expectStatus(resp, 200);
      expect(resp.data.data.batches.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /business/notifications/webhooks creates a webhook', async () => {
      const resp = await client.post(
        '/business/notifications/webhooks',
        { url: 'https://example.com/coverage-hook', secret: 's3cr3t', events: ['notification.sent'] },
        auth(),
      );
      expectStatus(resp, 201);
    });

    it('GET /business/notifications/webhooks lists org webhooks', async () => {
      const resp = await client.get('/business/notifications/webhooks', auth());
      expectStatus(resp, 200);
      expect(resp.data.data.webhooks.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Customer read surface', () => {
    let customerNotificationId: string;

    it('POST /business/notifications creates a notification for the customer', async () => {
      const resp = await createNotification(customerId, { userType: 'customer' });
      expectStatus(resp, 201);
      customerNotificationId = resp.data.data.notificationId;
    });

    it('GET /customer/notifications/count returns the unread count', async () => {
      const resp = await client.get('/customer/notifications/count', customerAuth());
      expectStatus(resp, 200);
      expect(resp.data.data.unreadCount).toBeGreaterThanOrEqual(1);
    });

    it('PUT /customer/notifications/:id/read marks it read', async () => {
      const resp = await client.put(`/customer/notifications/${customerNotificationId}/read`, {}, customerAuth());
      expectStatus(resp, 200);
    });

    it('PUT /customer/notifications/read marks all customer notifications read', async () => {
      await createNotification(customerId, { userType: 'customer' });
      const resp = await client.put('/customer/notifications/read', {}, customerAuth());
      expectStatus(resp, 200);
      expect(resp.data.data.markedCount).toBeGreaterThanOrEqual(1);

      const count = await client.get('/customer/notifications/count', customerAuth());
      expectStatus(count, 200);
      expect(count.data.data.unreadCount).toBe(0);
    });
  });

  describe('Customer devices', () => {
    const deviceToken = `coverage-device-${Date.now()}`;

    it('POST /customer/notifications/devices registers a device', async () => {
      const resp = await client.post(
        '/customer/notifications/devices',
        { deviceToken, platform: 'ios' },
        customerAuth(),
      );
      expectStatus(resp, 201);
    });

    it('GET /customer/notifications/devices lists the registered device', async () => {
      const resp = await client.get('/customer/notifications/devices', customerAuth());
      expectStatus(resp, 200);
      const tokens = resp.data.data.devices.map((d: { deviceToken: string }) => d.deviceToken);
      expect(tokens).toContain(deviceToken);
    });

    it('DELETE /customer/notifications/devices/:token deactivates it', async () => {
      const resp = await client.delete(`/customer/notifications/devices/${deviceToken}`, customerAuth());
      expectStatus(resp, 200);

      const list = await client.get('/customer/notifications/devices', customerAuth());
      const active = list.data.data.devices.filter(
        (d: { deviceToken: string; isActive?: boolean }) => d.deviceToken === deviceToken && d.isActive !== false,
      );
      expect(active.length).toBe(0);
    });
  });
});
