/**
 * Notification Webhook Repository Port
 *
 * Domain interface for notification webhook data access.
 */

export interface NotificationWebhook {
  notificationWebhookId: string;
  organizationId?: string;
  url: string;
  secret?: string;
  events: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationWebhookCreateParams = Omit<NotificationWebhook, 'notificationWebhookId' | 'createdAt' | 'updatedAt'>;

export interface NotificationWebhookRepository {
  findActive(event: string): Promise<NotificationWebhook[]>;
  findByMerchant(organizationId: string): Promise<NotificationWebhook[]>;
  create(params: NotificationWebhookCreateParams): Promise<NotificationWebhook | null>;
  deactivate(notificationWebhookId: string): Promise<void>;
  findAll(): Promise<NotificationWebhook[]>;
}
