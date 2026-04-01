/**
 * SendNotificationBatch Use Case
 *
 * Creates a batch record and enqueues individual notifications.
 * Skips delivery for customers with unsubscribe records and logs
 * suppression in notificationEventLog.
 *
 * Validates: Requirements 7.3
 */

import * as notificationBatchRepo from '../../infrastructure/repositories/notificationBatchRepo';
import notificationRepo from '../../infrastructure/repositories/notificationRepo';
import * as notificationUnsubscribeRepo from '../../infrastructure/repositories/notificationUnsubscribeRepo';
import * as notificationEventLogRepo from '../../infrastructure/repositories/notificationEventLogRepo';

// ============================================================================
// Command
// ============================================================================

export interface NotificationRecipient {
  userId: string;
  userType: string;
}

export class SendNotificationBatchCommand {
  constructor(
    public readonly name: string,
    public readonly channel: string,
    public readonly type: string,
    public readonly title: string,
    public readonly content: string,
    public readonly recipients: NotificationRecipient[],
    public readonly scheduledAt?: Date,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface SendNotificationBatchResponse {
  notificationBatchId: string;
  name: string;
  channel: string;
  status: string;
  totalCount: number;
  enqueuedCount: number;
  suppressedCount: number;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class SendNotificationBatchUseCase {
  constructor(
    private readonly batchRepo: typeof notificationBatchRepo = notificationBatchRepo,
    private readonly notifRepo: typeof notificationRepo = notificationRepo,
    private readonly unsubscribeRepo: typeof notificationUnsubscribeRepo = notificationUnsubscribeRepo,
    private readonly eventLogRepo: typeof notificationEventLogRepo = notificationEventLogRepo,
  ) {}

  async execute(command: SendNotificationBatchCommand): Promise<SendNotificationBatchResponse> {
    if (!command.name) throw new Error('Batch name is required');
    if (!command.channel) throw new Error('channel is required');
    if (!command.recipients || command.recipients.length === 0) throw new Error('At least one recipient is required');

    const batch = await this.batchRepo.create({
      name: command.name,
      channel: command.channel,
      totalCount: command.recipients.length,
      scheduledAt: command.scheduledAt,
    });

    if (!batch) throw new Error('Failed to create notification batch');

    let enqueuedCount = 0;
    let suppressedCount = 0;

    for (const recipient of command.recipients) {
      const isUnsubscribed = await this.unsubscribeRepo.isUnsubscribed(recipient.userId, command.channel, command.type);

      if (isUnsubscribed) {
        suppressedCount++;
        await this.eventLogRepo.create({
          eventType: 'notification.suppressed',
          entityId: batch.notificationBatchId,
          entityType: 'notificationBatch',
          payload: {
            userId: recipient.userId,
            userType: recipient.userType,
            channel: command.channel,
            type: command.type,
            reason: 'unsubscribed',
          },
        });
        continue;
      }

      await this.notifRepo.create({
        userId: recipient.userId,
        userType: recipient.userType,
        type: command.type,
        title: command.title,
        content: command.content,
        channel: command.channel,
      });

      enqueuedCount++;
    }

    return {
      notificationBatchId: batch.notificationBatchId,
      name: batch.name,
      channel: batch.channel,
      status: batch.status,
      totalCount: command.recipients.length,
      enqueuedCount,
      suppressedCount,
      createdAt: batch.createdAt.toISOString(),
    };
  }
}
