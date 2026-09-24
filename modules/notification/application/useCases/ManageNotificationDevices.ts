import type { NotificationDeviceRepository, NotificationDeviceUpsertParams } from '../../domain/repositories/NotificationDeviceRepository';

export class ManageNotificationDevicesUseCase {
  constructor(private readonly notificationDeviceRepo: NotificationDeviceRepository) {}

  async findByUser(userId: string) {
    return this.notificationDeviceRepo.findByUser(userId);
  }
  async upsert(params: NotificationDeviceUpsertParams) {
    return this.notificationDeviceRepo.upsert(params);
  }
  async deactivate(deviceToken: string) {
    return this.notificationDeviceRepo.deactivate(deviceToken);
  }
  async deleteByUser(userId: string) {
    return this.notificationDeviceRepo.deleteByUser(userId);
  }
}
