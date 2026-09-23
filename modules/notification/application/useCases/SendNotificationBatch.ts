/**
 * SendNotificationBatch Use Case
 *
 * Creates a batch record and enqueues individual notifications.
 * Skips delivery for customers with unsubscribe records and logs
 * suppression in notificationEventLog.
 *
 * Validates: Requirements 7.3
 */

import type { NotificationBatchRepository } from '../../domain/repositories/NotificationBatchRepository';
import type { NotificationCommandRepository } from '../../domain/repositories/NotificationCommandRepository';
import type { NotificationUnsubscribeRepository } from '../../domain/repositories/NotificationUnsubscribeRepository';
import type { NotificationEventLogRepository } from '../../domain/repositories/NotificationEventLogRepository';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

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
  targetCount: number;
  enqueuedCount: number;
  suppressedCount: number;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class SendNotificationBatchUseCase {
  constructor(
    private readonly batchRepo: NotificationBatchRepository,
    private readonly notifRepo: NotificationCommandRepository,
    private readonly unsubscribeRepo: NotificationUnsubscribeRepository,
    private readonly eventLogRepo: NotificationEventLogRepository,
  ) {}

  async execute(command: SendNotificationBatchCommand): Promise<SendNotificationBatchResponse> {
    if (!command.name) throw new NotificationValidationError('Batch name is required');
    if (!command.channel) throw new NotificationValidationError('channel is required');
    if (!command.recipients || command.recipients.length === 0) throw new NotificationValidationError('At least one recipient is required');

    const batch = await this.batchRepo.create({
      name: command.name,
      type: command.type,
      channel: command.channel,
      targetCount: command.recipients.length,
      scheduledAt: command.scheduledAt,
    });

    if (!batch) throw new NotificationValidationError('Failed to create notification batch');

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
      targetCount: command.recipients.length,
      enqueuedCount,
      suppressedCount,
      createdAt: batch.createdAt.toISOString(),
    };
  }
}
