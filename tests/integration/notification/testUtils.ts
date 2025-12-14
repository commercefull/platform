import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

// Export loginTestUser function for the tests
export const loginTestUser = async (
  client: AxiosInstance, 
  email: string = 'customer@example.com', 
  password: string = 'password123'
): Promise<string> => {
  const response = await client.post('/customer/identity/login', {
    email,
    password
  });
  
  if (response.status !== 200 || !response.data.accessToken) {
    throw new Error(`Failed to login test user: ${response.data.error || 'Unknown error'}`);
  }
  
  return response.data.accessToken;
};

// Test data for notifications
export const testNotificationData = {
  type: 'order_confirmation',
  title: 'Your order has been confirmed',
  content: 'Thank you for your order! Your order #TEST-123 has been confirmed and is being processed.',
  channel: 'in_app',
  priority: 'normal',
  category: 'order',
  data: {
    orderNumber: 'TEST-123',
    orderTotal: 99.99
  },
  isRead: false,
  metadata: {
    source: 'integration_test'
  }
};

// Test data for notification templates
export const testTemplateData = {
  code: `test-template-${Date.now()}`,
  name: 'Test Template',
  description: 'Template created for integration tests',
  type: 'order_confirmation',
  supportedChannels: ['email', 'in_app'],
  defaultChannel: 'email',
  subject: 'Test notification subject',
  htmlTemplate: '<h1>Hello {{name}}</h1><p>This is a test notification.</p>',
  textTemplate: 'Hello {{name}}. This is a test notification.',
  parameters: {
    name: 'string',
    testParam: 'string'
  },
  isActive: true,
  categoryCode: 'order',
  previewData: {
    name: 'Test User',
    testParam: 'Test Value'
  }
};

// Test data for notification preferences
export const testPreferenceData = {
  type: 'order_confirmation',
  channelPreferences: {
    email: true,
    sms: false,
    in_app: true,
    push: false
  },
  isEnabled: true,
  schedulePreferences: {
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    timezone: 'UTC'
  }
};

/**
 * Setup function for notification integration tests
 * Creates test data and returns necessary IDs and tokens
 */
export const setupNotificationTests = async () => {
  const client = createTestClient();
  const adminToken = await loginTestAdmin(client);
  const customerToken = await loginTestUser(client);
  
  // Use seeded test IDs
  const testUserId = '00000000-0000-0000-0000-000000000001';
  const notificationData = {
    ...testNotificationData,
    userId: testUserId,
    userType: 'customer'
  };
  
  const createNotificationResponse = await client.post('/business/notifications', notificationData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!createNotificationResponse.data.success) {
    throw new Error(`Failed to create test notification: ${createNotificationResponse.data.error}`);
  }
  
  const testNotificationId = createNotificationResponse.data.data.notificationId;
  
  // Create test template
  const createTemplateResponse = await client.post('/business/notification-templates', testTemplateData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!createTemplateResponse.data.success) {
    throw new Error(`Failed to create test template: ${createTemplateResponse.data.error}`);
  }
  
  const testTemplateId = createTemplateResponse.data.data.notificationTemplateId;
  
  // Skip preference creation for now - endpoint may not exist
  const testPreferenceId = 'test-preference-id';
  
  return {
    client,
    adminToken,
    customerToken,
    testUserId,
    testNotificationId,
    testTemplateId,
    testPreferenceId
  };
};

/**
 * Cleanup function for notification integration tests
 * Removes test data created during setup
 */
export const cleanupNotificationTests = async (
  client: AxiosInstance, 
  adminToken: string, 
  testNotificationId: string, 
  testTemplateId: string, 
  testPreferenceId: string
) => {
  try {
    // Delete test notification
    await client.delete(`/business/notifications/${testNotificationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test template
    await client.delete(`/business/notification-templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test preference
    await client.delete(`/business/notification-preferences/${testPreferenceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error cleaning up notification test data:', error);
  }
};
