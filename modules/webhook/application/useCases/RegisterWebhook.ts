/**
 * Register Webhook Use Case
 *
 * Creates a new webhook endpoint registration.
 */

import { generateUUID } from '../../../../libs/uuid';
import { WebhookEndpointEntity } from '../../domain/entities/WebhookEndpoint';
import { WebhookRepositoryInterface } from '../../domain/repositories/WebhookRepository';

export interface RegisterWebhookInput {
  name: string;
  url: string;
  events: string[];
  merchantId?: string;
  headers?: Record<string, string>;
  retryPolicy?: {
    maxRetries?: number;
    retryIntervalMs?: number;
    backoffMultiplier?: number;
  };
}

export class RegisterWebhookUseCase {
  constructor(private readonly repo: WebhookRepositoryInterface) {}

  async execute(input: RegisterWebhookInput): Promise<{
    webhookEndpointId: string;
    secret: string;
    endpoint: Record<string, any>;
  }> {
    if (!input.url || !input.url.startsWith('http')) {
      throw new Error('A valid HTTPS URL is required for webhook endpoints');
    }

    if (!input.events || input.events.length === 0) {
      throw new Error('At least one event type must be specified');
    }

    if (!input.name) {
      throw new Error('Webhook name is required');
    }

    const entity = WebhookEndpointEntity.create({
      webhookEndpointId: generateUUID(),
      name: input.name,
      url: input.url,
      events: input.events,
      merchantId: input.merchantId,
      headers: input.headers,
      retryPolicy: input.retryPolicy,
    });

    const saved = await this.repo.createEndpoint({
      webhookEndpointId: entity.webhookEndpointId,
      merchantId: entity.merchantId,
      name: entity.name,
      url: entity.url,
      secret: entity.secret,
      events: entity.events,
      isActive: entity.isActive,
      headers: entity.headers,
      retryPolicy: entity.retryPolicy,
    });

    return {
      webhookEndpointId: saved.webhookEndpointId,
      secret: entity.secret,
      endpoint: WebhookEndpointEntity.reconstitute(saved).toJSON(),
    };
  }
}
