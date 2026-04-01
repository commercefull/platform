/**
 * UnsubscribeNotification Use Case
 *
 * Creates an unsubscribe record and updates the notification preference
 * to disabled for the given channel/type.
 *
 * Validates: Requirements 7.4
 */

import * as notificationUnsubscribeRepo from '../../infrastructure/repositories/notificationUnsubscribeRepo';
import * as notificationPreferenceRepo from '../../infrastructure/repositories/notificationPreferenceRepo';

// ============================================================================
// Command
// ============================================================================

export class UnsubscribeNotificationCommand {
  constructor(
    public readonly userId: string,
    public readonly userType: string,
    public readonly channel: string,
    public readonly type?: string,
    public readonly reason?: string,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface UnsubscribeNotificationResponse {
  success: boolean;
  userId: string;
  channel: string;
  type?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class UnsubscribeNotificationUseCase {
  constructor(
    private readonly unsubscribeRepo: typeof notificationUnsubscribeRepo = notificationUnsubscribeRepo,
    private readonly preferenceRepo: typeof notificationPreferenceRepo = notificationPreferenceRepo,
  ) {}

  async execute(command: UnsubscribeNotificationCommand): Promise<UnsubscribeNotificationResponse> {
    if (!command.userId) throw new Error('userId is required');
    if (!command.channel) throw new Error('channel is required');

    await this.unsubscribeRepo.unsubscribe({
      userId: command.userId,
      userType: command.userType,
      channel: command.channel,
      type: command.type,
      reason: command.reason,
    });

    // Update preference to disabled if a type is specified
    if (command.type) {
      await this.preferenceRepo.upsert({
        userId: command.userId,
        userType: command.userType,
        channel: command.channel,
        type: command.type,
        isEnabled: false,
      });
    }

    return {
      success: true,
      userId: command.userId,
      channel: command.channel,
      type: command.type,
    };
  }
}
