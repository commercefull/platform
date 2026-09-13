/**
 * Notification Device Repository Port
 *
 * Domain interface for notification device data access.
 */

export interface NotificationDevice {
  notificationDeviceId: string;
  userId: string;
  userType: string;
  deviceToken: string;
  platform: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDeviceUpsertParams = Omit<NotificationDevice, 'notificationDeviceId' | 'createdAt' | 'updatedAt'>;

export interface NotificationDeviceRepository {
  findByUser(userId: string): Promise<NotificationDevice[]>;
  upsert(params: NotificationDeviceUpsertParams): Promise<NotificationDevice | null>;
  deactivate(deviceToken: string): Promise<void>;
  deleteByUser(userId: string): Promise<void>;
}
