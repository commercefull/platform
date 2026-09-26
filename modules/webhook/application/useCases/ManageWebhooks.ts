/**
 * Manage Webhooks Use Case
 *
 * Endpoint lookup, update, and delivery-history queries shared by the admin
 * and business webhook controllers.
 */

import { WebhookRepositoryInterface, WebhookDeliveryFilters } from '../../domain/repositories/WebhookRepository';
import { WebhookEndpointProps } from '../../domain/entities/WebhookEndpoint';
import { PaginationOptions } from 'libs/types/shared';

export class ManageWebhooksUseCase {
  constructor(private readonly repo: WebhookRepositoryInterface) {}

  async findEndpointById(id: string) {
    return this.repo.findEndpointById(id);
  }

  async updateEndpoint(id: string, updates: Partial<WebhookEndpointProps>) {
    return this.repo.updateEndpoint(id, updates);
  }

  async findDeliveries(filters?: WebhookDeliveryFilters, pagination?: PaginationOptions) {
    return this.repo.findDeliveries(filters, pagination);
  }
}
