import notificationDataRepository from '../infrastructure/repositories/NotificationDataRepository';
import notificationConfigRepository from '../infrastructure/repositories/NotificationConfigRepository';
import type { NotificationPreference } from '../infrastructure/repositories/notificationPreferenceRepo';
import type { NotificationTemplate } from '../infrastructure/repositories/NotificationConfigRepository';

export { notificationDataRepository, notificationConfigRepository, NotificationPreference, NotificationTemplate };
