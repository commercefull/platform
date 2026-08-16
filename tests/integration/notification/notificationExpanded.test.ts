/**
 * Notification Expanded Tests
 * Tests: email, SMS, push, templates, preferences, batch sending
 */

import { AxiosInstance } from 'axios';
import { setupNotificationTests, cleanupNotificationTests, testTemplateData } from './testUtils';
import { expectStatus } from '../testUtils';

describe('Notification Expanded Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testUserId: string;
  let testNotificationId: string;
  let testTemplateId: string;
  let testPreferenceId: string;

  beforeAll(async () => {
    jest.setTimeout(30000);
    const setup = await setupNotificationTests();
    client = setup.client;
    adminToken = setup.adminToken;
    customerToken = setup.customerToken;
    testUserId = setup.testUserId;
    testNotificationId = setup.testNotificationId;
    testTemplateId = setup.testTemplateId;
    testPreferenceId = setup.testPreferenceId;
  });

  afterAll(async () => {
    await cleanupNotificationTests(client, adminToken, testNotificationId, testTemplateId, testPreferenceId);
  });

  const authHeaders = () => ({ Authorization: `Bearer ${customerToken}` });
  const adminAuthHeaders = () => ({ Authorization: `Bearer ${adminToken}` });

  // ============================================================================
  // Notification CRUD Tests
  // ============================================================================

  describe.skip('Notification CRUD', () => {
    it('should list user notifications', async () => {
      if (!customerToken) return;

      const resp = await client.get('/customer/notifications', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should get a specific notification', async () => {
      if (!customerToken) return;

      const listResp = await client.get('/customer/notifications', {
        headers: authHeaders(),
      });

      if (listResp.data.data?.length > 0) {
        const notifId = listResp.data.data[0].notificationId;
        const resp = await client.get(`/customer/notifications/${notifId}`, {
          headers: authHeaders(),
        });

        expect(resp.status).toBe(200);
        expect(resp.data.success).toBe(true);
      }
    });

    it('should mark notification as read', async () => {
      if (!customerToken) return;

      const listResp = await client.get('/customer/notifications', {
        headers: authHeaders(),
      });

      if (listResp.data.data?.length > 0) {
        const notifId = listResp.data.data[0].notificationId;
        const resp = await client.patch(
          `/customer/notifications/${notifId}/read`,
          {},
          { headers: authHeaders() },
        );

        expectStatus(resp, 200);
      }
    });

    it('should mark all notifications as read', async () => {
      if (!customerToken) return;

      const resp = await client.post(
        '/customer/notifications/read',
        {},
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
    });
  });

  // ============================================================================
  // Notification Preferences Tests
  // ============================================================================

  describe.skip('Notification Preferences', () => {
    it('should get user notification preferences', async () => {
      if (!customerToken) return;

      const resp = await client.get('/customer/notifications/preferences', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
    });

    it('should update notification preferences', async () => {
      if (!customerToken) return;

      const resp = await client.post(
        '/customer/notifications/preferences',
        {
          type: 'order_confirmation',
          channelPreferences: {
            email: true,
            sms: false,
            in_app: true,
            push: true,
          },
          isEnabled: true,
        },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
    });

    it('should disable a notification type', async () => {
      if (!customerToken) return;

      const resp = await client.post(
        '/customer/notifications/preferences',
        {
          type: 'marketing',
          channelPreferences: {
            email: false,
            sms: false,
            in_app: false,
            push: false,
          },
          isEnabled: false,
        },
        { headers: authHeaders() },
      );

      expectStatus(resp, 200);
    });
  });

  // ============================================================================
  // Notification Template Tests (Admin)
  // ============================================================================

  describe.skip('Notification Templates (Admin)', () => {
    let createdTemplateId: string;

    it('should create a notification template', async () => {
      if (!adminToken) return;

      const resp = await client.post('/business/notifications/templates', testTemplateData, {
        headers: adminAuthHeaders(),
      });

      expectStatus(resp, 201);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('notificationTemplateId');
      createdTemplateId = resp.data.data.notificationTemplateId;
    });

    it('should list notification templates', async () => {
      if (!adminToken) return;

      const resp = await client.get('/business/notifications/templates', {
        headers: adminAuthHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(Array.isArray(resp.data.data)).toBe(true);
    });

    it('should get a specific template', async () => {
      if (!adminToken) return;

      const resp = await client.get('/business/notifications/templates', {
        headers: adminAuthHeaders(),
      });

      if (resp.data.data?.length > 0) {
        const templateId = resp.data.data[0].notificationTemplateId;
        const getResp = await client.get(`/business/notifications/templates/${templateId}`, {
          headers: adminAuthHeaders(),
        });

        expect(getResp.status).toBe(200);
      }
    });

    it('should update a template', async () => {
      if (!adminToken || !createdTemplateId) return;

      const resp = await client.post(
        `/business/notifications/templates/${createdTemplateId}`,
        { ...testTemplateData, description: 'Updated template' },
        { headers: adminAuthHeaders() },
      );

      expectStatus(resp, 200);
    });

    it('should delete a template', async () => {
      if (!adminToken || !createdTemplateId) return;

      const resp = await client.delete(`/business/notifications/templates/${createdTemplateId}`, {
        headers: adminAuthHeaders(),
      });

      expectStatus(resp, 200);
    });
  });

  // ============================================================================
  // Admin Notification Sending Tests
  // ============================================================================

  describe.skip('Admin Notification Sending', () => {
    it('should send a notification to a user', async () => {
      if (!adminToken) return;

      const resp = await client.post(
        '/business/notifications/batcheses',
        {
          userId: testUserId || '00000000-0000-0000-0000-000000001001',
          type: 'test_notification',
          title: 'Test Notification',
          content: 'This is a test notification from admin',
          channel: 'in_app',
        },
        { headers: adminAuthHeaders() },
      );

      expectStatus(resp, 201);
    });

    it('should send batch notifications', async () => {
      if (!adminToken) return;

      const resp = await client.post(
        '/business/notifications/batches',
        {
          userIds: [testUserId || '00000000-0000-0000-0000-000000001001'],
          type: 'batch_test',
          title: 'Batch Test',
          content: 'Batch test notification',
          channel: 'in_app',
        },
        { headers: adminAuthHeaders() },
      );

      expectStatus(resp, 201);
    });
  });

  // ============================================================================
  // Unread Count Tests
  // ============================================================================

  describe.skip('Unread Count', () => {
    it('should get unread notification count', async () => {
      if (!customerToken) return;

      const resp = await client.get('/customer/notifications/unread-count', {
        headers: authHeaders(),
      });

      expect(resp.status).toBe(200);
      expect(resp.data.success).toBe(true);
      expect(resp.data.data).toHaveProperty('count');
    });
  });

  // ============================================================================
  // Authorization Tests
  // ============================================================================

  describe('Authorization', () => {
    it('should require auth for listing notifications', async () => {
      const resp = await client.get('/customer/notifications');
      expectStatus(resp, 401);
    });

    it('should require auth for preferences', async () => {
      const resp = await client.get('/customer/notifications/preferences');
      expectStatus(resp, 401);
    });

    it('should require admin for sending notifications', async () => {
      const resp = await client.post('/business/notifications/batcheses', {
        userId: 'test',
        type: 'test',
        title: 'Test',
        content: 'Test',
      });
      expectStatus(resp, 401);
    });
  });
});
