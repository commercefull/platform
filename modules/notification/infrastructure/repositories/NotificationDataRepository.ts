/**
 * Consolidated Notification Data Repository
 *
 * Merges notificationRepo, notificationBatchRepo, notificationDeliveryLogRepo,
 * notificationEventLogRepo, storefrontNotificationRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Notification Delivery (notifications, batches, delivery logs, event logs, storefront)
 */

import notificationRepo from './notificationRepo';
import notificationBatchRepo from './notificationBatchRepo';
import notificationDeliveryLogRepo from './notificationDeliveryLogRepo';
import notificationEventLogRepo from './notificationEventLogRepo';
import storefrontNotificationRepo from './storefrontNotificationRepo';

class NotificationDataRepository {
  readonly notifications = notificationRepo;
  readonly batches = notificationBatchRepo;
  readonly deliveryLogs = notificationDeliveryLogRepo;
  readonly eventLogs = notificationEventLogRepo;
  readonly storefront = storefrontNotificationRepo;
}

export default new NotificationDataRepository();
