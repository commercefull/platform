/**
 * Notification Command Repository Port
 *
 * Domain interface for notification data access (notifications aggregate).
 */

import { Notification } from '../../../../libs/db/types';

export type NotificationCreateParams = Partial<Omit<Notification, 'notificationId' | 'createdAt' | 'updatedAt'>> & {
  userId: string;
  userType: string;
  type: string;
  title: string;
  content: string;
  channel: string;
};

export type NotificationUpdateParams = Partial<Omit<Notification, 'notificationId' | 'createdAt' | 'updatedAt'>>;

export interface NotificationCommandRepository {
  findById(notificationId: string): Promise<Notification | null>;
  findAll(limit?: number, offset?: number): Promise<Notification[]>;
  findByUser(userId: string, limit?: number): Promise<Notification[]>;
  findUnreadByUser(userId: string): Promise<Notification[]>;
  findByUserAndType(userId: string, type: string): Promise<Notification[]>;
  create(params: NotificationCreateParams): Promise<Notification>;
  update(notificationId: string, params: NotificationUpdateParams): Promise<Notification | null>;
  markAsRead(notificationId: string): Promise<Notification | null>;
  markAllAsRead(userId: string): Promise<number>;
  markAsSent(notificationId: string): Promise<Notification | null>;
  delete(notificationId: string): Promise<boolean>;
  deleteAllForUser(userId: string): Promise<number>;
  countUnread(userId: string): Promise<number>;
  findUnsent(limit?: number): Promise<Notification[]>;
}
