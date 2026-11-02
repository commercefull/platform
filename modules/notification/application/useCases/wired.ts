/**
 * Notification use-case composition root.
 * Instantiates use cases with concrete repository slices and exports
 * ready-made instances for controllers/resolvers.
 */

import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';
import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';


import { GetNotificationDeliveryLogsUseCase } from './GetNotificationDeliveryLogs';
import { GetTemplateTranslationsUseCase } from './GetTemplateTranslations';

import { ManageNotificationBatchesUseCase } from './ManageNotificationBatches';
import { ManageNotificationPreferenceUseCase } from './ManageNotificationPreference';
import { ManageNotificationTemplatesUseCase } from './ManageNotificationTemplates';
import { ManageNotificationWebhookUseCase } from './ManageNotificationWebhook';
import { ManageNotificationWebhooksAdminUseCase } from './ManageNotificationWebhooksAdmin';
import { ManageNotificationDevicesUseCase } from './ManageNotificationDevices';
import { ManageNotificationPreferencesUseCase } from './ManageNotificationPreferences';
import { MarkAsReadUseCase } from './MarkAsRead';
import { ManageNotificationRecordsUseCase } from './ManageNotificationRecords';
import { ManageStorefrontNotificationsUseCase } from './ManageStorefrontNotifications';
import { RegisterNotificationDeviceUseCase } from './RegisterNotificationDevice';
import { SendNotificationBatchUseCase } from './SendNotificationBatch';

import { UpsertTemplateTranslationUseCase } from './UpsertTemplateTranslation';

export const getNotificationDeliveryLogsUseCase = new GetNotificationDeliveryLogsUseCase(notificationDataRepository.deliveryLogs);
export const getTemplateTranslationsUseCase = new GetTemplateTranslationsUseCase(notificationConfigRepository.templateTranslations);

export const manageNotificationBatchesUseCase = new ManageNotificationBatchesUseCase(notificationDataRepository.batches);
export const manageNotificationPreferenceUseCase = new ManageNotificationPreferenceUseCase(notificationConfigRepository.preferences);
export const manageNotificationTemplatesUseCase = new ManageNotificationTemplatesUseCase(notificationConfigRepository.templates);
export const manageNotificationWebhookUseCase = new ManageNotificationWebhookUseCase(notificationConfigRepository.webhooks);
export const manageNotificationWebhooksAdminUseCase = new ManageNotificationWebhooksAdminUseCase(notificationConfigRepository.webhooks);
export const manageNotificationDevicesUseCase = new ManageNotificationDevicesUseCase(notificationConfigRepository.devices);
export const manageNotificationPreferencesUseCase = new ManageNotificationPreferencesUseCase(notificationConfigRepository.preferences);
export const manageNotificationRecordsUseCase = new ManageNotificationRecordsUseCase(notificationDataRepository.notifications);
export const markAsReadUseCase = new MarkAsReadUseCase(notificationDataRepository.notifications);
export const manageStorefrontNotificationsUseCase = new ManageStorefrontNotificationsUseCase(notificationDataRepository.storefront);
export const registerNotificationDeviceUseCase = new RegisterNotificationDeviceUseCase(notificationConfigRepository.devices);
export const sendNotificationBatchUseCase = new SendNotificationBatchUseCase(
  notificationDataRepository.batches,
  notificationDataRepository.notifications,
  notificationConfigRepository.unsubscribes,
  notificationDataRepository.eventLogs,
);

export const upsertTemplateTranslationUseCase = new UpsertTemplateTranslationUseCase(notificationConfigRepository.templateTranslations);

import { GetNotificationsUseCase } from './GetNotifications';
import { SendNotificationUseCase } from './SendNotification';

export const getNotificationsUseCase = new GetNotificationsUseCase(notificationDataRepository.notifications);
export const sendNotificationUseCase = new SendNotificationUseCase(
  notificationDataRepository.notifications,
  notificationDataRepository.notifications,
);
