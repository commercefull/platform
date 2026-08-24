/**
 * Register Webhook Use Case
 *
 * Creates a new webhook endpoint registration.
 */

import { generateUUID } from '../../../../libs/uuid';
import { WebhookEndpointEntity } from '../../domain/entities/WebhookEndpoint';
import { WebhookRepositoryInterface } from '../../domain/repositories/WebhookRepository';
import { WebhookValidationError } from '../../domain/errors/WebhookErrors';

export interface RegisterWebhookInput {
  name: string;
  url: string;
  events: string[];
  organizationId?: string;
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
    endpoint: Record<string, unknown>;
  }> {
    if (!input.url || !input.url.startsWith('http')) {
      throw new WebhookValidationError('A valid HTTPS URL is required for webhook endpoints');
    }

    if (!input.events || input.events.length === 0) {
      throw new WebhookValidationError('At least one event type must be specified');
    }

    if (!input.name) {
      throw new WebhookValidationError('Webhook name is required');
    }

    const entity = WebhookEndpointEntity.create({
      webhookEndpointId: generateUUID(),
      name: input.name,
      url: input.url,
      events: input.events,
      organizationId: input.organizationId,
      headers: input.headers,
      retryPolicy: input.retryPolicy,
    });

    const saved = await this.repo.createEndpoint({
      webhookEndpointId: entity.webhookEndpointId,
      organizationId: entity.organizationId,
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
