/**
 * Integration Event Handlers
 *
 * Registers the dispatcher that forwards eventBus events to
 * third-party integration subscriptions.
 *
 * Called from boot/registerEventHandlers.ts on app boot.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { logger } from '../../../libs/logger';
import { IntegrationEventDispatcher } from './services/IntegrationEventDispatcher';
import { integrationRepo, credentialRepo, subscriptionRepo, logRepo } from './useCases/wired';

export function registerIntegrationEventHandlers(): void {
  const dispatcher = new IntegrationEventDispatcher(eventBus, integrationRepo, credentialRepo, subscriptionRepo, logRepo);
  dispatcher.register();
  logger.info('Integration event dispatcher registered');
}
