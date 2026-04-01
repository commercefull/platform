/**
 * ManageNotificationPreference Use Case
 *
 * Upserts customer notification preferences via notificationPreferenceRepo.
 *
 * Validates: Requirements 7.1
 */

import * as notificationPreferenceRepo from '../../infrastructure/repositories/notificationPreferenceRepo';

// ============================================================================
// Command
// ============================================================================

export class ManageNotificationPreferenceCommand {
  constructor(
    public readonly userId: string,
    public readonly userType: string,
    public readonly channel: string,
    public readonly type: string,
    public readonly isEnabled: boolean,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ManageNotificationPreferenceResponse {
  notificationPreferenceId: string;
  userId: string;
  userType: string;
  channel: string;
  type: string;
  isEnabled: boolean;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageNotificationPreferenceUseCase {
  constructor(
    private readonly preferenceRepo: typeof notificationPreferenceRepo = notificationPreferenceRepo,
  ) {}

  async execute(command: ManageNotificationPreferenceCommand): Promise<ManageNotificationPreferenceResponse> {
    if (!command.userId) throw new Error('userId is required');
    if (!command.channel) throw new Error('channel is required');
    if (!command.type) throw new Error('type is required');

    const preference = await this.preferenceRepo.upsert({
      userId: command.userId,
      userType: command.userType,
      channel: command.channel,
      type: command.type,
      isEnabled: command.isEnabled,
    });

    if (!preference) throw new Error('Failed to upsert notification preference');

    return {
      notificationPreferenceId: preference.notificationPreferenceId,
      userId: preference.userId,
      userType: preference.userType,
      channel: preference.channel,
      type: preference.type,
      isEnabled: preference.isEnabled,
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}
