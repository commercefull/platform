/**
 * Notification Preference Repository Port
 *
 * Domain interface for notification preference data access.
 */

export interface NotificationPreference {
  notificationPreferenceId: string;
  userId: string;
  userType: string;
  type: string;
  channelPreferences: Record<string, boolean>;
  isEnabled: boolean;
  schedulePreferences?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  updatedAt: Date;
}

export type NotificationPreferenceUpsertParams = Omit<NotificationPreference, 'notificationPreferenceId' | 'updatedAt'>;

export interface NotificationPreferenceRepository {
  findByUser(userId: string, userType: string): Promise<NotificationPreference[]>;
  findById(notificationPreferenceId: string): Promise<NotificationPreference | null>;
  findByUserAndType(userId: string, userType: string, type: string): Promise<NotificationPreference | null>;
  findAll(): Promise<NotificationPreference[]>;
  upsert(params: NotificationPreferenceUpsertParams): Promise<NotificationPreference | null>;
  update(
    notificationPreferenceId: string,
    params: Partial<Omit<NotificationPreference, 'notificationPreferenceId' | 'userId' | 'userType' | 'type' | 'updatedAt'>>,
  ): Promise<NotificationPreference | null>;
  deleteById(notificationPreferenceId: string): Promise<boolean>;
  deleteByUser(userId: string): Promise<void>;
  bulkUpsert(
    userId: string,
    userType: string,
    updates: Array<{
      type: string;
      channelPreferences?: Record<string, boolean>;
      isEnabled?: boolean;
      schedulePreferences?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    }>,
  ): Promise<{ updated: number; created: number }>;
}
