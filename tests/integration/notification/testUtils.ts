import { AxiosInstance } from 'axios';

// Export loginTestUser function for the tests
export const loginTestUser = async (
  client: AxiosInstance,
  email: string = 'customer@example.com',
  password: string = 'password123',
): Promise<string> => {
  try {
    const response = await client.post(
      '/customer/identity/login',
      {
        email,
        password,
      },
      { headers: { 'X-Test-Request': 'true' } },
    );

    if (response.status === 200 && response.data?.accessToken) {
      return response.data.accessToken;
    }

    return '';
  } catch {
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
    orderTotal: 99.99,
  },
  isRead: false,
  metadata: {
    source: 'integration_test',
  },
};

// Test data for notification templates
export const testTemplateData = {
  // Matches seeded template 00000000-0000-0000-0000-000000000103
  code: 'test-template-seeded',
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
    testParam: 'string',
  },
  isActive: true,
  categoryCode: 'order',
  previewData: {
    name: 'Test User',
    testParam: 'Test Value',
  },
};

// Test data for notification preferences
export const testPreferenceData = {
  type: 'order_confirmation',
  channelPreferences: {
    email: true,
    sms: false,
    in_app: true,
    push: false,
  },
  isEnabled: true,
  schedulePreferences: {
    doNotDisturbStart: '22:00',
    doNotDisturbEnd: '08:00',
    timezone: 'UTC',
  },
};

/**
 * Setup function for notification integration tests
 * Creates test data and returns necessary IDs and tokens
 */
// Seeded notification fixtures (seeds/20240805001215_seedTestNotification.js, 20240805001208_seedNotificationPreference.js)
export const SEEDED_NOTIFICATION_ID = '00000000-0000-0000-0000-000000000100';
export const SEEDED_TEMPLATE_ID = '00000000-0000-0000-0000-000000000103';
export const SEEDED_PREFERENCE_ID = '00000000-0000-0000-0000-000000000105';
