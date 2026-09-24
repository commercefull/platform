/**
 * Webhook Event Handlers
 *
 * Starts the dispatch service that forwards eventBus events to
 * registered webhook endpoints.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { WebhookDispatchService } from './services/WebhookDispatchService';
import type { WebhookRepositoryInterface } from '../domain/repositories/WebhookRepository';

export function registerWebhookEventHandlers(repo: WebhookRepositoryInterface): WebhookDispatchService {
  const service = new WebhookDispatchService(repo);
  service.start();
  return service;
}
