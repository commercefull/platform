/**
 * Notification Delivery Log Repository Port
 *
 * Domain interface for notification delivery log data access.
 */

export type NotificationChannel = 'email' | 'sms' | 'in_app' | 'push';
export type NotificationType = 'orderStatus' | 'promotion' | 'accountAlert';
export type DeliveryStatus = 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced' | 'blocked';
export type UserType = 'customer' | 'organization' | 'admin';

export interface NotificationDeliveryLog {
  notificationDeliveryLogId: string;
  createdAt: string;
  notificationId?: string;
  userId: string;
  userType: UserType;
  type: NotificationType;
  channel: NotificationChannel;
  recipient: string;
  status: DeliveryStatus;
  statusDetails?: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureReason?: string;
  provider?: string;
  providerMessageId?: string;
  providerResponse?: Record<string, unknown>;
  retryCount: number;
}

export type NotificationDeliveryLogCreateParams = Omit<
  NotificationDeliveryLog,
  'notificationDeliveryLogId' | 'createdAt' | 'retryCount' | 'sentAt' | 'deliveredAt' | 'failedAt'
>;

export type NotificationDeliveryLogUpdateParams = Partial<
  Pick<
    NotificationDeliveryLog,
    | 'status'
    | 'statusDetails'
    | 'sentAt'
    | 'deliveredAt'
    | 'failedAt'
    | 'failureReason'
    | 'providerMessageId'
    | 'providerResponse'
    | 'retryCount'
  >
>;

export interface NotificationDeliveryLogRepository {
  findById(notificationDeliveryLogId: string): Promise<NotificationDeliveryLog | null>;
  findByNotificationId(notificationId: string): Promise<NotificationDeliveryLog[]>;
  findByUserId(userId: string, limit?: number, offset?: number): Promise<NotificationDeliveryLog[]>;
  findByBatchId(batchId: string, limit?: number): Promise<NotificationDeliveryLog[]>;
  findByStatus(status: DeliveryStatus, limit?: number, offset?: number): Promise<NotificationDeliveryLog[]>;
  findByChannel(channel: NotificationChannel, limit?: number, offset?: number): Promise<NotificationDeliveryLog[]>;
  findByProvider(provider: string, limit?: number, offset?: number): Promise<NotificationDeliveryLog[]>;
  findFailed(limit?: number, offset?: number): Promise<NotificationDeliveryLog[]>;
  findPending(limit?: number): Promise<NotificationDeliveryLog[]>;
  create(params: NotificationDeliveryLogCreateParams): Promise<NotificationDeliveryLog>;
  update(notificationDeliveryLogId: string, params: NotificationDeliveryLogUpdateParams): Promise<NotificationDeliveryLog | null>;
  markAsSent(notificationDeliveryLogId: string, providerMessageId?: string): Promise<NotificationDeliveryLog | null>;
  markAsDelivered(notificationDeliveryLogId: string): Promise<NotificationDeliveryLog | null>;
  markAsFailed(notificationDeliveryLogId: string, failureReason: string): Promise<NotificationDeliveryLog | null>;
  markAsBounced(notificationDeliveryLogId: string, failureReason: string): Promise<NotificationDeliveryLog | null>;
  markAsBlocked(notificationDeliveryLogId: string, failureReason: string): Promise<NotificationDeliveryLog | null>;
  incrementRetryCount(notificationDeliveryLogId: string): Promise<NotificationDeliveryLog | null>;
  delete(notificationDeliveryLogId: string): Promise<boolean>;
  countByStatus(status: DeliveryStatus): Promise<number>;
  getStatistics(timeRange?: { start: string; end: string }): Promise<{
    total: number;
    pending: number;
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    blocked: number;
    deliveryRate: number;
  }>;
  getStatisticsByChannel(): Promise<Record<NotificationChannel, { sent: number; delivered: number; failed: number }>>;
  cleanupOldLogs(daysToKeep?: number): Promise<number>;
}
