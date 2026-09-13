/**
 * Notification Unsubscribe Repository Port
 *
 * Domain interface for notification unsubscribe data access.
 */

export interface NotificationUnsubscribe {
  notificationUnsubscribeId: string;
  userId: string;
  userType: string;
  channel: string;
  type?: string;
  reason?: string;
  createdAt: Date;
}

export interface NotificationUnsubscribeRepository {
  isUnsubscribed(userId: string, channel: string, type?: string): Promise<boolean>;
  unsubscribe(params: Omit<NotificationUnsubscribe, 'notificationUnsubscribeId' | 'createdAt'>): Promise<void>;
  resubscribe(userId: string, channel: string, type?: string): Promise<void>;
  findByUser(userId: string): Promise<NotificationUnsubscribe[]>;
}
