/**
 * LogNotificationEvent Use Case
 *
 * Creates an event log entry for audit purposes.
 *
 * Validates: Requirements 7.5
 */

import * as notificationEventLogRepo from '../../infrastructure/repositories/notificationEventLogRepo';

// ============================================================================
// Command
// ============================================================================

export class LogNotificationEventCommand {
  constructor(
    public readonly eventType: string,
    public readonly entityId?: string,
    public readonly entityType?: string,
    public readonly payload?: Record<string, any>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface LogNotificationEventResponse {
  notificationEventLogId: string;
  eventType: string;
  entityId?: string;
  entityType?: string;
  createdAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class LogNotificationEventUseCase {
  constructor(
    private readonly eventLogRepo: typeof notificationEventLogRepo = notificationEventLogRepo,
  ) {}

  async execute(command: LogNotificationEventCommand): Promise<LogNotificationEventResponse> {
    if (!command.eventType) throw new Error('eventType is required');

    const entry = await this.eventLogRepo.create({
      eventType: command.eventType,
      entityId: command.entityId,
      entityType: command.entityType,
      payload: command.payload,
    });

    if (!entry) throw new Error('Failed to create notification event log entry');

    return {
      notificationEventLogId: entry.notificationEventLogId,
      eventType: entry.eventType,
      entityId: entry.entityId,
      entityType: entry.entityType,
      createdAt: entry.createdAt.toISOString(),
    };
  }
}
