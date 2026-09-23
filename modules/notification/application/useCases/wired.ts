/**
 * Notification use-case composition root.
 * Instantiates use cases with concrete repository slices and exports
 * ready-made instances for controllers/resolvers.
 */

import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';
import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

import { DeleteNotificationUseCase } from './DeleteNotification';
import { GetNotificationDeliveryLogsUseCase } from './GetNotificationDeliveryLogs';
import { GetTemplateTranslationsUseCase } from './GetTemplateTranslations';
import { LogNotificationEventUseCase } from './LogNotificationEvent';
import { ManageNotificationBatchesUseCase } from './ManageNotificationBatches';
import { ManageNotificationPreferenceUseCase } from './ManageNotificationPreference';
import { ManageNotificationTemplatesUseCase } from './ManageNotificationTemplates';
import { ManageNotificationWebhookUseCase } from './ManageNotificationWebhook';
import { ManageNotificationWebhooksAdminUseCase } from './ManageNotificationWebhooksAdmin';
import { ManageNotificationDevicesUseCase } from './ManageNotificationDevices';
import { ManageStorefrontNotificationsUseCase } from './ManageStorefrontNotifications';
import { RegisterNotificationDeviceUseCase } from './RegisterNotificationDevice';
import { SendNotificationBatchUseCase } from './SendNotificationBatch';
import { UnsubscribeNotificationUseCase } from './UnsubscribeNotification';
import { UpsertTemplateTranslationUseCase } from './UpsertTemplateTranslation';

export const deleteNotificationUseCase = new DeleteNotificationUseCase(notificationDataRepository.notifications);
export const getNotificationDeliveryLogsUseCase = new GetNotificationDeliveryLogsUseCase(notificationDataRepository.deliveryLogs);
export const getTemplateTranslationsUseCase = new GetTemplateTranslationsUseCase(notificationConfigRepository.templateTranslations);
export const logNotificationEventUseCase = new LogNotificationEventUseCase(notificationDataRepository.eventLogs);
export const manageNotificationBatchesUseCase = new ManageNotificationBatchesUseCase(notificationDataRepository.batches);
export const manageNotificationPreferenceUseCase = new ManageNotificationPreferenceUseCase(notificationConfigRepository.preferences);
export const manageNotificationTemplatesUseCase = new ManageNotificationTemplatesUseCase(notificationConfigRepository.templates);
export const manageNotificationWebhookUseCase = new ManageNotificationWebhookUseCase(notificationConfigRepository.webhooks);
export const manageNotificationWebhooksAdminUseCase = new ManageNotificationWebhooksAdminUseCase(notificationConfigRepository.webhooks);
export const manageNotificationDevicesUseCase = new ManageNotificationDevicesUseCase(notificationConfigRepository.devices);
export const manageStorefrontNotificationsUseCase = new ManageStorefrontNotificationsUseCase(notificationDataRepository.storefront);
export const registerNotificationDeviceUseCase = new RegisterNotificationDeviceUseCase(notificationConfigRepository.devices);
export const sendNotificationBatchUseCase = new SendNotificationBatchUseCase(
  notificationDataRepository.batches,
  notificationDataRepository.notifications,
  notificationConfigRepository.unsubscribes,
  notificationDataRepository.eventLogs,
);
export const unsubscribeNotificationUseCase = new UnsubscribeNotificationUseCase(
  notificationConfigRepository.unsubscribes,
  notificationConfigRepository.preferences,
);
export const upsertTemplateTranslationUseCase = new UpsertTemplateTranslationUseCase(notificationConfigRepository.templateTranslations);
