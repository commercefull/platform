import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

// Export loginTestUser function for the tests
export const loginTestUser = async (
  client: AxiosInstance, 
  email: string = 'customer@example.com', 
  password: string = 'password123'
): Promise<string> => {
  const response = await client.post('/api/auth/login', {
    email,
    password
  });
  
  if (!response.data.success) {
    throw new Error(`Failed to login test user: ${response.data.error}`);
  }
  
  return response.data.data.token;
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
  
  // Get test user ID
  const userResponse = await client.get('/api/account/profile', {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  if (!userResponse.data.success) {
    throw new Error(`Failed to get test user profile: ${userResponse.data.error}`);
  }
  
  const testUserId = userResponse.data.data.id;
  
  // Create test notification
  const notificationData = {
    ...testNotificationData,
    userId: testUserId,
    userType: 'customer'
  };
  
  const createNotificationResponse = await client.post('/api/admin/notifications', notificationData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!createNotificationResponse.data.success) {
    throw new Error(`Failed to create test notification: ${createNotificationResponse.data.error}`);
  }
  
  const testNotificationId = createNotificationResponse.data.data.id;
  
  // Create test template
  const createTemplateResponse = await client.post('/api/admin/notification-templates', testTemplateData, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  
  if (!createTemplateResponse.data.success) {
    throw new Error(`Failed to create test template: ${createTemplateResponse.data.error}`);
  }
  
  const testTemplateId = createTemplateResponse.data.data.id;
  
  // Create test preference
  const preferenceData = {
    ...testPreferenceData,
    userId: testUserId,
    userType: 'customer'
  };
  
  const createPreferenceResponse = await client.post('/api/account/notification-preferences', preferenceData, {
    headers: { Authorization: `Bearer ${customerToken}` }
  });
  
  if (!createPreferenceResponse.data.success) {
    throw new Error(`Failed to create test preference: ${createPreferenceResponse.data.error}`);
  }
  
  const testPreferenceId = createPreferenceResponse.data.data.id;
  
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
    await client.delete(`/api/admin/notifications/${testNotificationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test template
    await client.delete(`/api/admin/notification-templates/${testTemplateId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // Delete test preference
    await client.delete(`/api/admin/notification-preferences/${testPreferenceId}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
  } catch (error) {
    console.error('Error cleaning up notification test data:', error);
  }
};
