import { AxiosInstance } from 'axios';
import { createTestClient, loginTestAdmin } from '../testUtils';

// Export loginTestUser function for the tests
export const loginTestUser = async (
  client: AxiosInstance, 
  email: string = 'customer@example.com', 
  password: string = 'password123'
): Promise<string> => {
  try {
    const response = await client.post('/customer/identity/login', {
      email,
      password
    }, { headers: { 'X-Test-Request': 'true' } });
    
    if (response.status === 200 && response.data?.accessToken) {
      return response.data.accessToken;
    }
    
    console.log('Warning: Customer login failed:', response.status, response.data?.error || 'Unknown error');
    return '';
  } catch (error) {
    console.log('Warning: Customer login error:', error);
    return '';
  }
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
  let adminToken = '';
  let customerToken = '';
  let testNotificationId = '';
  let testTemplateId = '';
  let testPreferenceId = '';
  const testUserId = '00000000-0000-0000-0000-000000000001';
  
  try {
    adminToken = await loginTestAdmin(client);
  } catch (error) {
    console.log('Warning: Failed to get admin token for notification tests');
  }
  
  try {
    customerToken = await loginTestUser(client);
  } catch (error) {
    console.log('Warning: Failed to get customer token for notification tests');
  }
  
  if (adminToken) {
    try {
      // Create test notification
      const notificationData = {
        ...testNotificationData,
        userId: testUserId,
        userType: 'customer'
      };
      
      const createNotificationResponse = await client.post('/business/notifications', notificationData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createNotificationResponse.data?.data?.notificationId) {
        testNotificationId = createNotificationResponse.data.data.notificationId;
      } else {
        console.log('Warning: Failed to create test notification:', createNotificationResponse.data);
      }
      
      // Create test template
      const createTemplateResponse = await client.post('/business/notification-templates', testTemplateData, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      if (createTemplateResponse.data?.data?.notificationTemplateId) {
        testTemplateId = createTemplateResponse.data.data.notificationTemplateId;
      } else {
        console.log('Warning: Failed to create test template:', createTemplateResponse.data);
      }
    } catch (error) {
      console.log('Warning: Notification test setup error:', error);
    }
  }
  
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
  client: AxiosInstance | undefined, 
  adminToken: string | undefined, 
  testNotificationId?: string, 
  testTemplateId?: string, 
  testPreferenceId?: string
) => {
  if (!client || !adminToken) {
    return;
  }
  
  try {
    // Delete test notification
    if (testNotificationId) {
      await client.delete(`/business/notifications/${testNotificationId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    
    // Delete test template
    if (testTemplateId) {
      await client.delete(`/business/notification-templates/${testTemplateId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    
    // Delete test preference
    if (testPreferenceId) {
      await client.delete(`/business/notification-preferences/${testPreferenceId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      }).catch(() => {});
    }
  } catch (error) {
    // Silently ignore cleanup errors
  }
};
