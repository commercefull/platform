/**
 * Notification Batch Repository Port
 *
 * Domain interface for notification batch data access.
 */

export interface NotificationBatch {
  notificationBatchId: string;
  name: string;
  type: string;
  channel: string;
  status: string;
  targetCount: number;
  sentCount: number;
  failedCount: number;
  scheduledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationBatchRepository {
  create(params: Pick<NotificationBatch, 'name' | 'type' | 'channel' | 'targetCount' | 'scheduledAt'>): Promise<NotificationBatch | null>;
  findById(notificationBatchId: string): Promise<NotificationBatch | null>;
  updateProgress(notificationBatchId: string, sentCount: number, failedCount: number): Promise<void>;
  complete(notificationBatchId: string): Promise<void>;
  findAll(limit?: number, offset?: number): Promise<NotificationBatch[]>;
  count(): Promise<number>;
}
