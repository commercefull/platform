/**
 * UnsubscribeNotification Use Case
 *
 * Creates an unsubscribe record and updates the notification preference
 * to disabled for the given channel/type.
 *
 * Validates: Requirements 7.4
 */

import type { NotificationUnsubscribeRepository } from '../../domain/repositories/NotificationUnsubscribeRepository';
import type { NotificationPreferenceRepository } from '../../domain/repositories/NotificationPreferenceRepository';
import { NotificationValidationError } from '../../domain/errors/NotificationErrors';

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
    private readonly unsubscribeRepo: NotificationUnsubscribeRepository,
    private readonly preferenceRepo: NotificationPreferenceRepository,
  ) {}

  async execute(command: UnsubscribeNotificationCommand): Promise<UnsubscribeNotificationResponse> {
    if (!command.userId) throw new NotificationValidationError('userId is required');
    if (!command.channel) throw new NotificationValidationError('channel is required');

    await this.unsubscribeRepo.unsubscribe({
      userId: command.userId,
      category: command.type || command.channel,
      reason: command.reason,
    });

    // Update preference to disabled if a type is specified
    if (command.type) {
      await this.preferenceRepo.upsert({
        userId: command.userId,
        userType: command.userType,
        type: command.type,
        channelPreferences: { [command.channel]: false },
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
