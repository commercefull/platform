/**
 * List Webhooks Use Case
 *
 * Retrieves webhook endpoints with optional filtering and pagination.
 */

import { WebhookRepositoryInterface, WebhookEndpointFilters } from '../../domain/repositories/WebhookRepository';

export class ListWebhooksUseCase {
  constructor(private readonly repo: WebhookRepositoryInterface) {}

  async execute(filters?: WebhookEndpointFilters, limit = 50, offset = 0) {
    return this.repo.findEndpoints(filters, { limit, offset });
  }
}
