/**
 * Unregister Webhook Use Case
 *
 * Removes a webhook endpoint registration.
 */

import { WebhookRepositoryInterface } from '../../domain/repositories/WebhookRepository';

export class UnregisterWebhookUseCase {
  constructor(private readonly repo: WebhookRepositoryInterface) {}

  async execute(webhookEndpointId: string): Promise<boolean> {
    if (!webhookEndpointId) {
      throw new Error('Webhook endpoint ID is required');
    }

    const endpoint = await this.repo.findEndpointById(webhookEndpointId);
    if (!endpoint) {
      throw new Error('Webhook endpoint not found');
    }

    return this.repo.deleteEndpoint(webhookEndpointId);
  }
}
