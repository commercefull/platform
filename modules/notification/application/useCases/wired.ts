import notificationConfigRepository from '../../infrastructure/repositories/NotificationConfigRepository';
import notificationDataRepository from '../../infrastructure/repositories/NotificationDataRepository';

const notificationDeviceRepo = notificationConfigRepository.devices;
const storefrontNotificationRepo = notificationDataRepository.storefront;
import { RegisterNotificationDeviceUseCase } from './RegisterNotificationDevice';

export const registerNotificationDeviceUseCase = new RegisterNotificationDeviceUseCase(notificationDeviceRepo);

export class ManageStorefrontNotificationsUseCase {
  async countByUserId(userId: string) {
    return storefrontNotificationRepo.countByUserId(userId);
  }
  async findByUserId(userId: string, limit: number, offset: number) {
    return storefrontNotificationRepo.findByUserId(userId, limit, offset);
  }
  async countUnreadByUserId(userId: string) {
    return storefrontNotificationRepo.countUnreadByUserId(userId);
  }
  async markAsRead(notificationId: string, userId: string) {
    return storefrontNotificationRepo.markAsRead(notificationId, userId);
  }
  async markAllAsRead(userId: string) {
    return storefrontNotificationRepo.markAllAsRead(userId);
  }
  async getPreferences(userId: string) {
    return storefrontNotificationRepo.getPreferences(userId);
  }
  async upsertPreferences(userId: string, prefs: Parameters<typeof storefrontNotificationRepo.upsertPreferences>[1]) {
    return storefrontNotificationRepo.upsertPreferences(userId, prefs);
  }
}

export class ManageNotificationDevicesUseCase {
  async findByUser(userId: string) {
    return notificationDeviceRepo.findByUser(userId);
  }
  async upsert(params: Parameters<typeof notificationDeviceRepo.upsert>[0]) {
    return notificationDeviceRepo.upsert(params);
  }
  async deactivate(deviceToken: string) {
    return notificationDeviceRepo.deactivate(deviceToken);
  }
  async deleteByUser(userId: string) {
    return notificationDeviceRepo.deleteByUser(userId);
  }
}
