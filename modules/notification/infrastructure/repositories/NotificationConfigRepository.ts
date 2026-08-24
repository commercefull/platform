/**
 * Consolidated Notification Config Repository
 *
 * Merges notificationTemplateRepo, notificationTemplateTranslationRepo,
 * notificationCategoryRepo, notificationPreferenceRepo,
 * notificationUnsubscribeRepo, notificationWebhookRepo, notificationDeviceRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Notification Config (templates, translations, categories, preferences, unsubscribes, webhooks, devices)
 */

import notificationTemplateRepo from './notificationTemplateRepo';
import notificationTemplateTranslationRepo from './notificationTemplateTranslationRepo';
import notificationCategoryRepo from './notificationCategoryRepo';
import notificationPreferenceRepo from './notificationPreferenceRepo';
import notificationUnsubscribeRepo from './notificationUnsubscribeRepo';
import notificationWebhookRepo from './notificationWebhookRepo';
import notificationDeviceRepo from './notificationDeviceRepo';

// Re-export NotificationTemplate type for backward compatibility
export type { NotificationTemplate } from './notificationTemplateRepo';

class NotificationConfigRepository {
  readonly templates = notificationTemplateRepo;
  readonly templateTranslations = notificationTemplateTranslationRepo;
  readonly categories = notificationCategoryRepo;
  readonly preferences = notificationPreferenceRepo;
  readonly unsubscribes = notificationUnsubscribeRepo;
  readonly webhooks = notificationWebhookRepo;
  readonly devices = notificationDeviceRepo;
}

export default new NotificationConfigRepository();
