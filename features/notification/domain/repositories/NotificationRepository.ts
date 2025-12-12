/**
 * Notification Repository Interface
 */

import { Notification, NotificationType, NotificationStatus } from '../entities/Notification';

export interface NotificationFilters {
  recipientId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  channel?: string;
}

export interface NotificationRepository {
  findById(notificationId: string): Promise<Notification | null>;
  findByRecipient(recipientId: string, limit?: number): Promise<Notification[]>;
  findPending(): Promise<Notification[]>;
  save(notification: Notification): Promise<Notification>;
  delete(notificationId: string): Promise<void>;
  markAllAsRead(recipientId: string): Promise<number>;
  countUnread(recipientId: string): Promise<number>;
}
