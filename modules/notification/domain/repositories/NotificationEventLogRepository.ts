/**
 * Notification Event Log Repository Port
 *
 * Domain interface for notification event log data access.
 */

export interface NotificationEventLog {
  notificationEventLogId: string;
  eventType: string;
  entityId?: string;
  entityType?: string;
  payload?: Record<string, unknown>;
  processedAt?: Date;
  createdAt: Date;
}

export interface NotificationEventLogRepository {
  create(params: Omit<NotificationEventLog, 'notificationEventLogId' | 'createdAt'>): Promise<NotificationEventLog | null>;
  findUnprocessed(limit?: number): Promise<NotificationEventLog[]>;
  markProcessed(notificationEventLogId: string): Promise<void>;
}
