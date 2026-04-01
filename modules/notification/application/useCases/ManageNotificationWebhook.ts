/**
 * ManageNotificationWebhook Use Case
 *
 * CRUD for webhook endpoints.
 *
 * Validates: Requirements 7.6
 */

import * as notificationWebhookRepo from '../../infrastructure/repositories/notificationWebhookRepo';

// ============================================================================
// Command
// ============================================================================

export type WebhookAction = 'create' | 'deactivate' | 'list';

export class ManageNotificationWebhookCommand {
  constructor(
    public readonly action: WebhookAction,
    public readonly merchantId?: string,
    public readonly notificationWebhookId?: string,
    public readonly url?: string,
    public readonly secret?: string,
    public readonly events?: string[],
    public readonly isActive?: boolean,
  ) {}
}

// ============================================================================
// Response
// ============================================================================

export interface WebhookRecord {
  notificationWebhookId: string;
  merchantId?: string;
  url: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManageNotificationWebhookResponse {
  success: boolean;
  webhook?: WebhookRecord;
  webhooks?: WebhookRecord[];
  error?: string;
}

// ============================================================================
// Use Case
// ============================================================================

export class ManageNotificationWebhookUseCase {
  constructor(
    private readonly webhookRepo: typeof notificationWebhookRepo = notificationWebhookRepo,
  ) {}

  async execute(command: ManageNotificationWebhookCommand): Promise<ManageNotificationWebhookResponse> {
    switch (command.action) {
      case 'create': {
        if (!command.url) return { success: false, error: 'url is required' };
        if (!command.events || command.events.length === 0) return { success: false, error: 'events are required' };

        const webhook = await this.webhookRepo.create({
          merchantId: command.merchantId,
          url: command.url,
          secret: command.secret,
          events: command.events,
          isActive: command.isActive ?? true,
        });

        if (!webhook) return { success: false, error: 'Failed to create webhook' };

        return {
          success: true,
          webhook: this.mapWebhook(webhook),
        };
      }

      case 'deactivate': {
        if (!command.notificationWebhookId) return { success: false, error: 'notificationWebhookId is required' };

        await this.webhookRepo.deactivate(command.notificationWebhookId);

        return { success: true };
      }

      case 'list': {
        if (!command.merchantId) return { success: false, error: 'merchantId is required' };

        const webhooks = await this.webhookRepo.findByMerchant(command.merchantId);

        return {
          success: true,
          webhooks: webhooks.map(w => this.mapWebhook(w)),
        };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  }

  private mapWebhook(webhook: notificationWebhookRepo.NotificationWebhook): WebhookRecord {
    return {
      notificationWebhookId: webhook.notificationWebhookId,
      merchantId: webhook.merchantId,
      url: webhook.url,
      events: webhook.events,
      isActive: webhook.isActive,
      createdAt: webhook.createdAt.toISOString(),
      updatedAt: webhook.updatedAt.toISOString(),
    };
  }
}
