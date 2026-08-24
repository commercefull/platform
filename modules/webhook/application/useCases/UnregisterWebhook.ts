/**
 * Unregister Webhook Use Case
 *
 * Removes a webhook endpoint registration.
 */

import { WebhookRepositoryInterface } from '../../domain/repositories/WebhookRepository';
import { WebhookValidationError, WebhookEndpointNotFoundError } from '../../domain/errors/WebhookErrors';

export class UnregisterWebhookUseCase {
  constructor(private readonly repo: WebhookRepositoryInterface) {}

  async execute(webhookEndpointId: string): Promise<boolean> {
    if (!webhookEndpointId) {
      throw new WebhookValidationError('Webhook endpoint ID is required');
    }

    const endpoint = await this.repo.findEndpointById(webhookEndpointId);
    if (!endpoint) {
      throw new WebhookEndpointNotFoundError(webhookEndpointId);
    }

    return this.repo.deleteEndpoint(webhookEndpointId);
  }
}
