/**
 * Event Transport Factory
 *
 * Resolves EVENT_BUS_PROVIDER and builds the matching EventTransport.
 * Cloud SDKs are optional peer dependencies loaded lazily — see
 * loadProviderSdk() in ../eventTransport.ts.
 */

import type { EventPayload } from '../eventTypes';
import type { EventBusProvider, EventTransport } from '../eventTransport';
import { setEventTransport } from '../transportRegistry';
import { createMemoryTransport } from './memoryProvider';
import { createPostgresTransport } from './postgres/postgresProvider';
import { logger } from '../../logger';

type DispatchFn = (payload: EventPayload) => Promise<void>;

const VALID_PROVIDERS: EventBusProvider[] = ['memory', 'postgres', 'gcp-pubsub', 'aws-sqs', 'azure-servicebus'];

/**
 * Resolve the configured provider. Defaults to `memory` (historical
 * behavior). `OUTBOX_DISABLED=1` is a legacy alias that forces `memory`
 * even when EVENT_BUS_PROVIDER is set.
 */
export function resolveEventBusProvider(env: NodeJS.ProcessEnv = process.env): EventBusProvider {
  const raw = env.EVENT_BUS_PROVIDER;
  if (env.OUTBOX_DISABLED === '1') {
    if (raw && raw !== 'memory') {
      logger.warn('OUTBOX_DISABLED=1 overrides EVENT_BUS_PROVIDER', { provider: raw });
    }
    return 'memory';
  }
  if (raw) {
    if ((VALID_PROVIDERS as string[]).includes(raw)) return raw as EventBusProvider;
    logger.warn('Unknown EVENT_BUS_PROVIDER, falling back to memory', { provider: raw });
  }
  return 'memory';
}

export async function createEventTransport(
  dispatch: DispatchFn,
  env: NodeJS.ProcessEnv = process.env,
): Promise<EventTransport> {
  const provider = resolveEventBusProvider(env);

  switch (provider) {
    case 'postgres':
      return createPostgresTransport();
    case 'gcp-pubsub': {
      const { createGcpPubSubTransport } = await import('./gcpPubSubProvider.js');
      return createGcpPubSubTransport(env);
    }
    case 'aws-sqs': {
      const { createAwsSqsTransport } = await import('./awsSqsProvider.js');
      return createAwsSqsTransport(env);
    }
    case 'azure-servicebus': {
      const { createAzureServiceBusTransport } = await import('./azureServiceBusProvider.js');
      return createAzureServiceBusTransport(env);
    }
    default:
      return createMemoryTransport(dispatch);
  }
}

/**
 * Build and install the configured transport. Called once at application boot.
 */
export async function initEventTransport(dispatch: DispatchFn, env: NodeJS.ProcessEnv = process.env): Promise<EventBusProvider> {
  const transport = await createEventTransport(dispatch, env);
  setEventTransport(transport);
  logger.info('Event transport initialized', { provider: transport.provider });
  return transport.provider;
}
