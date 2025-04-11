import { AxiosInstance } from 'axios';
import { setupNotificationTests, cleanupNotificationTests, testPreferenceData } from './testUtils';

/**
 * Interface for NotificationPreference objects to ensure type safety in tests
 */
interface NotificationPreference {
  id: string;
  userId: string;
  userType: string;
  type: string;
  channelPreferences: Record<string, boolean>;
  isEnabled: boolean;
  schedulePreferences?: Record<string, any>;
  metadata?: Record<string, any>;
  updatedAt: string;
  [key: string]: any;
}

describe('Notification Preference Tests', () => {
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

  describe('Customer Preference Operations', () => {
    it('should get all preferences for customer', async () => {
      const response = await client.get('/api/account/notification-preferences', {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
      
      // Verify camelCase in response data (TypeScript interface)
      const preferences = response.data.data as NotificationPreference[];
      expect(preferences[0]).toHaveProperty('userId');
      expect(preferences[0]).toHaveProperty('userType');
      expect(preferences[0]).toHaveProperty('channelPreferences');
      expect(preferences[0]).toHaveProperty('isEnabled');
      expect(preferences[0]).toHaveProperty('updatedAt');
      
      // Verify no snake_case properties are exposed in the API
      expect(preferences[0]).not.toHaveProperty('user_id');
      expect(preferences[0]).not.toHaveProperty('user_type');
      expect(preferences[0]).not.toHaveProperty('channel_preferences');
      expect(preferences[0]).not.toHaveProperty('is_enabled');
      expect(preferences[0]).not.toHaveProperty('updated_at');
    });

    it('should get a preference by ID for customer', async () => {
      const response = await client.get(`/api/account/notification-preferences/${testPreferenceId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id', testPreferenceId);
      
      // Check preference properties match our test data
      const preference = response.data.data as NotificationPreference;
      expect(preference.type).toBe(testPreferenceData.type);
      expect(preference.isEnabled).toBe(testPreferenceData.isEnabled);
      expect(preference.channelPreferences).toEqual(testPreferenceData.channelPreferences);
      expect(preference.schedulePreferences).toEqual(testPreferenceData.schedulePreferences);
    });

    it('should get preference by notification type for customer', async () => {
      const response = await client.get(`/api/account/notification-preferences/type/${testPreferenceData.type}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('type', testPreferenceData.type);
      
      // Should match our test preference
      const preference = response.data.data as NotificationPreference;
      expect(preference.id).toBe(testPreferenceId);
      expect(preference.channelPreferences).toEqual(testPreferenceData.channelPreferences);
    });

    it('should create a new preference for customer', async () => {
      const newPreferenceData = {
        type: 'back_in_stock',
        channelPreferences: {
          email: true,
          sms: true,
          in_app: false,
          push: false
        },
        isEnabled: true
      };
      
      const response = await client.post('/api/account/notification-preferences', newPreferenceData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('id');
      
      // Verify properties
      const createdPreference = response.data.data as NotificationPreference;
      expect(createdPreference.type).toBe(newPreferenceData.type);
      expect(createdPreference.isEnabled).toBe(newPreferenceData.isEnabled);
      expect(createdPreference.channelPreferences).toEqual(newPreferenceData.channelPreferences);
      expect(createdPreference.userId).toBe(testUserId);
      
      // Clean up
      await client.delete(`/api/account/notification-preferences/${createdPreference.id}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
    });

    it('should update a preference for customer', async () => {
      const updateData = {
        channelPreferences: {
          email: false,
          sms: true,
          in_app: true,
          push: false
        },
        isEnabled: false
      };
      
      const response = await client.put(`/api/account/notification-preferences/${testPreferenceId}`, updateData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify updates
      const updatedPreference = response.data.data as NotificationPreference;
      expect(updatedPreference.channelPreferences).toEqual(updateData.channelPreferences);
      expect(updatedPreference.isEnabled).toBe(updateData.isEnabled);
      
      // Original data should remain unchanged
      expect(updatedPreference.type).toBe(testPreferenceData.type);
      expect(updatedPreference.userId).toBe(testUserId);
    });

    it('should update schedule preferences', async () => {
      const scheduleData = {
        schedulePreferences: {
          doNotDisturbStart: '23:00',
          doNotDisturbEnd: '07:00',
          timezone: 'Europe/London',
          weekendOnly: true
        }
      };
      
      const response = await client.put(`/api/account/notification-preferences/${testPreferenceId}/schedule`, scheduleData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify updates
      const updatedPreference = response.data.data as NotificationPreference;
      expect(updatedPreference.schedulePreferences).toEqual(scheduleData.schedulePreferences);
    });

    it('should delete a preference for customer', async () => {
      // Create a preference to delete
      const deletePreferenceData = {
        type: 'review_request',
        channelPreferences: {
          email: true,
          sms: false,
          in_app: true,
          push: false
        },
        isEnabled: true
      };
      
      const createResponse = await client.post('/api/account/notification-preferences', deletePreferenceData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      const deleteId = createResponse.data.data.id;
      
      // Delete the preference
      const response = await client.delete(`/api/account/notification-preferences/${deleteId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify deletion
      const getResponse = await client.get(`/api/account/notification-preferences/${deleteId}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(getResponse.status).toBe(404);
      expect(getResponse.data.success).toBe(false);
    });
  });

  describe('Admin Preference Operations', () => {
    it('should get all preferences for all users (admin)', async () => {
      const response = await client.get('/api/admin/notification-preferences', {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      expect(response.data.data.length).toBeGreaterThan(0);
    });

    it('should get all preferences for a specific user (admin)', async () => {
      const response = await client.get(`/api/admin/notification-preferences/user/${testUserId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(Array.isArray(response.data.data)).toBe(true);
      
      // All preferences should be for the specific user
      const preferences = response.data.data as NotificationPreference[];
      expect(preferences.every(p => p.userId === testUserId)).toBe(true);
      
      // Should include our test preference
      const testPreference = preferences.find(p => p.id === testPreferenceId);
      expect(testPreference).toBeDefined();
    });

    it('should update a user preference (admin)', async () => {
      const updateData = {
        channelPreferences: {
          email: true,
          sms: false,
          in_app: true,
          push: true
        },
        isEnabled: true,
        metadata: {
          updatedByAdmin: true,
          reason: 'Integration test'
        }
      };
      
      const response = await client.put(`/api/admin/notification-preferences/${testPreferenceId}`, updateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      
      // Verify updates
      const updatedPreference = response.data.data as NotificationPreference;
      expect(updatedPreference.channelPreferences).toEqual(updateData.channelPreferences);
      expect(updatedPreference.isEnabled).toBe(updateData.isEnabled);
      expect(updatedPreference.metadata).toMatchObject(updateData.metadata);
    });
  });

  describe('Bulk Preference Operations', () => {
    it('should bulk update preferences for a customer', async () => {
      const bulkUpdateData = {
        updates: [
          {
            type: testPreferenceData.type,
            isEnabled: false,
            channelPreferences: {
              email: false,
              sms: false,
              in_app: false,
              push: false
            }
          },
          // Add another preference to update or create
          {
            type: 'price_drop',
            isEnabled: true,
            channelPreferences: {
              email: true,
              sms: false,
              in_app: true,
              push: false
            }
          }
        ]
      };
      
      const response = await client.post('/api/account/notification-preferences/bulk', bulkUpdateData, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      expect(response.status).toBe(200);
      expect(response.data.success).toBe(true);
      expect(response.data.data).toHaveProperty('updated');
      expect(response.data.data).toHaveProperty('created');
      expect(response.data.data.updated + response.data.data.created).toBe(bulkUpdateData.updates.length);
      
      // Verify the updates worked
      const getResponse = await client.get(`/api/account/notification-preferences/type/${testPreferenceData.type}`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      
      const updatedPreference = getResponse.data.data as NotificationPreference;
      expect(updatedPreference.isEnabled).toBe(false);
      expect(updatedPreference.channelPreferences).toEqual({
        email: false,
        sms: false,
        in_app: false,
        push: false
      });
    });
  });
});
