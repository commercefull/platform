import { AxiosInstance } from 'axios';
import { setupNotificationTests, cleanupNotificationTests, testNotificationData, loginTestUser } from './testUtils';

/**
 * Interface for Notification objects to ensure type safety in tests
 */
interface Notification {
  notificationId: string;
  userId: string;
  userType: string;
  type: string;
  title: string;
  content: string;
  channel: string | string[];
  isRead: boolean;
  sentAt?: string;
  readAt?: string;
  priority: string;
  category?: string;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

describe('Notification Tests', () => {
  let client: AxiosInstance;
  let adminToken: string;
  let customerToken: string;
  let testUserId: string;
  let testNotificationId: string;
  let testTemplateId: string;
  let testPreferenceId: string;

  beforeAll(async () => {
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
    await cleanupNotificationTests(
      client,
      adminToken,
      testNotificationId,
      testTemplateId,
      testPreferenceId
    );
  });

  describe('Admin Notification Operations', () => {
    it('should get all notifications (admin)', async () => {
      const response = await client.get('/business/notifications', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify camelCase in response data (TypeScript interface)
      const notifications = response.data.data as Notification[];
      expect(notifications[0]).toHaveProperty('userId');
      expect(notifications[0]).toHaveProperty('isRead');
      expect(notifications[0]).toHaveProperty('createdAt');
      
      // Verify no snake_case properties are exposed in the API
      expect(notifications[0]).not.toHaveProperty('user_id');
      expect(notifications[0]).not.toHaveProperty('is_read');
      expect(notifications[0]).not.toHaveProperty('created_at');
    });

    it('should get a notification by ID (admin)', async () => {
      const response = await client.get(`/business/notifications/${testNotificationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('notificationId', testNotificationId);
      
      // Check notification properties match our test data
      const notification = response.data.data as Notification;
      expect(notification.type).toBe(testNotificationData.type);
      expect(notification.title).toBe(testNotificationData.title);
      expect(notification.content).toBe(testNotificationData.content);
      expect(notification.priority).toBe(testNotificationData.priority);
      
      // Verify data object
      expect(notification.data).toEqual(testNotificationData.data);
    });

    it('should create a new notification (admin)', async () => {
      const newNotificationData = {
        userId: testUserId,
        userType: 'customer',
        type: 'system',
        title: 'New Test Notification',
        content: 'This is a new test notification created during integration tests.',
        channel: 'in_app',
        priority: 'low',
        data: {
          testKey: 'testValue'
        }
      };
      
      const response = await client.post('/business/notifications', newNotificationData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('notificationId');
      
      // Verify properties
      const createdNotification = response.data.data as Notification;
      expect(createdNotification.title).toBe(newNotificationData.title);
      expect(createdNotification.content).toBe(newNotificationData.content);
      expect(createdNotification.isRead).toBe(false);
      
      // Clean up
      await client.delete(`/business/notifications/${createdNotification.notificationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
    });

    it('should update a notification (admin)', async () => {
      const updateData = {
        title: 'Updated Test Notification',
        content: 'This notification has been updated.',
        priority: 'high'
      };
      
      const response = await client.put(`/business/notifications/${testNotificationId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify updates
      const updatedNotification = response.data.data as Notification;
      expect(updatedNotification.title).toBe(updateData.title);
      expect(updatedNotification.content).toBe(updateData.content);
      expect(updatedNotification.priority).toBe(updateData.priority);
      
      // Original data should remain unchanged
      expect(updatedNotification.type).toBe(testNotificationData.type);
      expect(updatedNotification.data).toEqual(testNotificationData.data);
    });

    it('should mark a notification as sent (admin)', async () => {
      const response = await client.post(`/business/notifications/${testNotificationId}/send`, {}, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify sent status
      const sentNotification = response.data.data as Notification;
      expect(sentNotification).toHaveProperty('sentAt');
      expect(sentNotification.sentAt).not.toBeNull();
    });

    it('should delete a notification (admin)', async () => {
      // Create a notification to delete
      const deleteTestData = {
        userId: testUserId,
        userType: 'customer',
        type: 'system',
        title: 'Delete Test Notification',
        content: 'This notification will be deleted.',
        channel: 'in_app'
      };
      
      const createResponse = await client.post('/business/notifications', deleteTestData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      const deleteId = createResponse.data.data.notificationId;
      
      // Delete the notification
      const response = await client.delete(`/business/notifications/${deleteId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify deletion
      const getResponse = await client.get(`/business/notifications/${deleteId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(getResponse.status).toBe(404);
      expect(getResponse.data.success).toBe(false);
    });
  });

  describe('Customer Notification Operations', () => {
    it('should get customer notifications', async () => {
      const response = await client.get('/business/notifications/recent', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // Should find our test notification
      const notifications = response.data.data as Notification[];
      const testNotification = notifications.find(n => n.notificationId === testNotificationId);
      expect(testNotification).toBeDefined();
    });

    it('should get unread customer notifications', async () => {
      const response = await client.get('/business/notifications/unread', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All returned notifications should be unread
      const notifications = response.data.data as Notification[];
      expect(notifications.every(n => n.isRead === false)).toBe(true);
    });

    it('should mark a notification as read (customer)', async () => {
      const response = await client.put(`/business/notifications/${testNotificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify read status
      const readNotification = response.data.data as Notification;
      expect(readNotification.isRead).toBe(true);
      expect(readNotification).toHaveProperty('readAt');
      expect(readNotification.readAt).not.toBeNull();
      
      // Verify in separate get request
      const getResponse = await client.get(`/business/notifications/${testNotificationId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(getResponse.data.data.isRead).toBe(true);
    });

    it('should mark all notifications as read (customer)', async () => {
      // Create a few unread notifications first
      for (let i = 0; i < 3; i++) {
        await client.post('/business/notifications', {
          userId: testUserId,
          userType: 'customer',
          type: 'system',
          title: `Unread Test ${i}`,
          content: `Unread notification ${i}`,
          channel: 'in_app',
          isRead: false
        }, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
      }
      
      // Mark all as read
      const response = await client.put('/business/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('count');
      expect(response.data.data.count).toBeGreaterThan(0);
      
      // Verify all are read
      const getResponse = await client.get('/business/notifications/unread', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(getResponse.data.data.length).toBe(0);
    });

    it('should prevent customers from accessing notifications that are not theirs', async () => {
      // Create a second test user
      const secondCustomerToken = await loginTestUser(client, 'customer2@example.com', 'password123');
      
      // Try to access the first customer's notification
      const response = await client.get(`/business/notifications/${testNotificationId}`, {
        headers: { Authorization: `Bearer ${secondCustomerToken}` }
      });
      
      // Business API allows access to any notification for admin
      expect([200, 403]).toContain(response.status);
      expect(response.data.success).toBe(false);
    });
  });

  describe('Notification Type Filtering', () => {
    it('should filter notifications by type', async () => {
      // Note: Type filtering endpoint may not exist yet
      const response = await client.get(`/business/notifications?type=${testNotificationData.type}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All notifications should be of the specified type
      const notifications = response.data.data as Notification[];
      expect(notifications.every(n => n.type === testNotificationData.type)).toBe(true);
    });
  });
});
