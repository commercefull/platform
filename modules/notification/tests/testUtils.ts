/**
 * Shared test utilities for notification use-case tests.
 * Notification use cases emit no events and generate no ids — the only
 * boundary is the injected repository ports.
 */

import type { NotificationBatch, NotificationBatchRepository } from '../domain/repositories/NotificationBatchRepository';
import type { NotificationCommandRepository } from '../domain/repositories/NotificationCommandRepository';
import type { NotificationDeliveryLog, NotificationDeliveryLogRepository } from '../domain/repositories/NotificationDeliveryLogRepository';
import type { NotificationDevice, NotificationDeviceRepository } from '../domain/repositories/NotificationDeviceRepository';
import type { NotificationEventLog, NotificationEventLogRepository } from '../domain/repositories/NotificationEventLogRepository';
import type { NotificationPreference, NotificationPreferenceRepository } from '../domain/repositories/NotificationPreferenceRepository';
import type { NotificationTemplate, NotificationTemplateRepository } from '../domain/repositories/NotificationTemplateRepository';
import type {
  NotificationTemplateTranslation,
  NotificationTemplateTranslationRepository,
} from '../domain/repositories/NotificationTemplateTranslationRepository';
import type { NotificationUnsubscribeRepository } from '../domain/repositories/NotificationUnsubscribeRepository';
import type { NotificationWebhook, NotificationWebhookRepository } from '../domain/repositories/NotificationWebhookRepository';
import type { StorefrontNotificationPort } from '../application/useCases/ManageStorefrontNotifications';

export function lazyMock<T extends object>(): jest.Mocked<T> {
  const cache = new Map<string | symbol, jest.Mock>();
  return new Proxy({} as jest.Mocked<T>, {
    get(target, prop) {
      if (prop === 'then') return undefined;
      if (!cache.has(prop)) cache.set(prop, jest.fn());
      return cache.get(prop);
    },
    // `in` checks (e.g. `'send' in service`) must see every port method
    has(target, prop) {
      return typeof prop === 'string' && prop !== 'then';
    },
  });
}

export function createNotificationBatchRepository(): jest.Mocked<NotificationBatchRepository> {
  return lazyMock<NotificationBatchRepository>();
}

export function createNotificationCommandRepository(): jest.Mocked<NotificationCommandRepository> {
  return lazyMock<NotificationCommandRepository>();
}

export function createNotificationDeliveryLogRepository(): jest.Mocked<NotificationDeliveryLogRepository> {
  return lazyMock<NotificationDeliveryLogRepository>();
}

export function createNotificationDeviceRepository(): jest.Mocked<NotificationDeviceRepository> {
  return lazyMock<NotificationDeviceRepository>();
}

export function createNotificationEventLogRepository(): jest.Mocked<NotificationEventLogRepository> {
  return lazyMock<NotificationEventLogRepository>();
}

export function createNotificationPreferenceRepository(): jest.Mocked<NotificationPreferenceRepository> {
  return lazyMock<NotificationPreferenceRepository>();
}

export function createNotificationTemplateRepository(): jest.Mocked<NotificationTemplateRepository> {
  return lazyMock<NotificationTemplateRepository>();
}

export function createNotificationTemplateTranslationRepository(): jest.Mocked<NotificationTemplateTranslationRepository> {
  return lazyMock<NotificationTemplateTranslationRepository>();
}

export function createNotificationUnsubscribeRepository(): jest.Mocked<NotificationUnsubscribeRepository> {
  return lazyMock<NotificationUnsubscribeRepository>();
}

export function createNotificationWebhookRepository(): jest.Mocked<NotificationWebhookRepository> {
  return lazyMock<NotificationWebhookRepository>();
}

export function createStorefrontNotificationPort(): jest.Mocked<StorefrontNotificationPort> {
  return lazyMock<StorefrontNotificationPort>();
}

// ---------------------------------------------------------------------------
// Record factories — domain repo rows (plain record types, not entities)
// ---------------------------------------------------------------------------

export function createNotificationBatch(overrides: Partial<NotificationBatch> = {}): NotificationBatch {
  return {
    notificationBatchId: 'batch-1',
    name: 'Promo blast',
    type: 'marketing',
    channel: 'email',
    status: 'pending',
    targetCount: 2,
    sentCount: 0,
    failedCount: 0,
    scheduledAt: undefined,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as NotificationBatch;
}

export function createNotificationDeliveryLog(overrides: Partial<NotificationDeliveryLog> = {}): NotificationDeliveryLog {
  return {
    notificationDeliveryLogId: 'log-1',
    notificationId: 'ntf-1',
    userId: 'u-1',
    userType: 'customer',
    type: 'orderStatus',
    channel: 'email',
    recipient: 'u-1',
    status: 'delivered',
    retryCount: 0,
    createdAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createNotificationEventLog(overrides: Partial<NotificationEventLog> = {}): NotificationEventLog {
  return {
    notificationEventLogId: 'evt-1',
    eventType: 'notification.sent',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  } as NotificationEventLog;
}

export function createNotificationPreference(overrides: Partial<NotificationPreference> = {}): NotificationPreference {
  return {
    notificationPreferenceId: 'pref-1',
    userId: 'u-1',
    userType: 'customer',
    type: 'order_updates',
    channelPreferences: { email: true },
    isEnabled: true,
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  };
}

export function createNotificationTemplate(overrides: Partial<NotificationTemplate> = {}): NotificationTemplate {
  return {
    notificationTemplateId: 'tpl-1',
    code: 'order_shipped',
    name: 'Order Shipped',
    type: 'order',
    supportedChannels: ['email'],
    defaultChannel: 'email',
    subject: 'Your order shipped',
    textTemplate: 'Hi {{name}}',
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function createNotificationTemplateTranslation(
  overrides: Partial<NotificationTemplateTranslation> = {},
): NotificationTemplateTranslation {
  return {
    notificationTemplateTranslationId: 'tr-1',
    templateId: 'tpl-1',
    locale: 'en-US',
    body: 'Hello',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as NotificationTemplateTranslation;
}

export function createNotificationDevice(overrides: Partial<NotificationDevice> = {}): NotificationDevice {
  return {
    notificationDeviceId: 'dev-1',
    userId: 'u-1',
    userType: 'customer',
    deviceToken: 'token-abc',
    platform: 'ios',
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as NotificationDevice;
}

export function createNotificationWebhook(overrides: Partial<NotificationWebhook> = {}): NotificationWebhook {
  return {
    notificationWebhookId: 'wh-1',
    organizationId: 'org-1',
    url: 'https://example.com/hook',
    events: ['order.created'],
    isActive: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  } as NotificationWebhook;
}
