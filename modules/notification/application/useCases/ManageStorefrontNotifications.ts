/**
 * Manage Storefront Notifications Use Cases
 *
 * Pass-through use cases for the storefront notification feed and
 * registered push devices. Dependencies are injected via constructor.
 */

export interface StorefrontNotificationPort {
  countByUserId(userId: string): Promise<number>;
  findByUserId(userId: string, limit: number, offset: number): Promise<unknown[]>;
  countUnreadByUserId(userId: string): Promise<number>;
  markAsRead(notificationId: string, userId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getPreferences(userId: string): Promise<unknown | null>;
  upsertPreferences(
    userId: string,
    prefs: { emailOrderUpdates: boolean; emailPromotions: boolean; emailNewsletter: boolean; pushEnabled: boolean },
  ): Promise<void>;
}

export class ManageStorefrontNotificationsUseCase {
  constructor(private readonly storefrontNotifications: StorefrontNotificationPort) {}

  async countByUserId(userId: string) {
    return this.storefrontNotifications.countByUserId(userId);
  }
  async findByUserId(userId: string, limit: number, offset: number) {
    return this.storefrontNotifications.findByUserId(userId, limit, offset);
  }
  async countUnreadByUserId(userId: string) {
    return this.storefrontNotifications.countUnreadByUserId(userId);
  }
  async markAsRead(notificationId: string, userId: string) {
    return this.storefrontNotifications.markAsRead(notificationId, userId);
  }
  async markAllAsRead(userId: string) {
    return this.storefrontNotifications.markAllAsRead(userId);
  }
  async getPreferences(userId: string) {
    return this.storefrontNotifications.getPreferences(userId);
  }
  async upsertPreferences(userId: string, prefs: Parameters<StorefrontNotificationPort['upsertPreferences']>[1]) {
    return this.storefrontNotifications.upsertPreferences(userId, prefs);
  }
}

