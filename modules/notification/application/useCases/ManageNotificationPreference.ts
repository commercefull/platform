/**
 * ManageNotificationPreference Use Case
 *
 * Upserts customer notification preferences via notificationPreferenceRepo.
 */

import * as notificationPreferenceRepo from '../../infrastructure/repositories/notificationPreferenceRepo';

// ============================================================================
// Command
// ============================================================================

export class ManageNotificationPreferenceCommand {
  constructor(
    public readonly userId: string,
    public readonly userType: string,
    public readonly type: string,
    public readonly channelPreferences: Record<string, boolean>,
    public readonly isEnabled: boolean,
    public readonly schedulePreferences?: Record<string, unknown>,
    public readonly metadata?: Record<string, unknown>,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface ManageNotificationPreferenceResponse {
  id: string;
  userId: string;
  userType: string;
  type: string;
  channelPreferences: Record<string, boolean>;
  isEnabled: boolean;
  schedulePreferences?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  updatedAt: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageNotificationPreferenceUseCase {
  constructor(private readonly preferenceRepo: typeof notificationPreferenceRepo = notificationPreferenceRepo) {}

  async execute(command: ManageNotificationPreferenceCommand): Promise<ManageNotificationPreferenceResponse> {
    if (!command.userId) throw new Error('userId is required');
    if (!command.type) throw new Error('type is required');

    const preference = await this.preferenceRepo.upsert({
      userId: command.userId,
      userType: command.userType,
      type: command.type,
      channelPreferences: command.channelPreferences || {},
      isEnabled: command.isEnabled,
      schedulePreferences: command.schedulePreferences || null,
      metadata: command.metadata || null,
    });

    if (!preference) throw new Error('Failed to upsert notification preference');

    return {
      id: preference.notificationPreferenceId,
      userId: preference.userId,
      userType: preference.userType,
      type: preference.type,
      channelPreferences: preference.channelPreferences,
      isEnabled: preference.isEnabled,
      schedulePreferences: preference.schedulePreferences || null,
      metadata: preference.metadata || null,
      updatedAt: preference.updatedAt.toISOString(),
    };
  }
}
