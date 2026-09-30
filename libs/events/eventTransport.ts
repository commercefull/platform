/**
 * Event Transport Abstraction
 *
 * Splits the event bus into a publisher port (producer side) and an optional
 * subscriber port (consumer side) so the same module API can be backed by
 * different messaging providers:
 *
 * - `memory`            — in-process dispatch (default; identical to the
 *                         historical EventEmitter behavior)
 * - `postgres`          — durable transactional outbox on platformEventOutbox,
 *                         drained by the claim-based outbox dispatcher
 * - `gcp-pubsub`        — Google Cloud Pub/Sub topic + pull subscription
 * - `aws-sqs`           — SQS queue publish + consume
 * - `azure-servicebus`  — Service Bus topic + subscription
 *
 * Select with EVENT_BUS_PROVIDER. A provider may omit `subscriber` when
 * publishing already delivers to handlers in-process (memory).
 */

import type { EventPayload } from './eventTypes';

export type EventBusProvider = 'memory' | 'postgres' | 'gcp-pubsub' | 'aws-sqs' | 'azure-servicebus';

/** Producer side: handed an EventPayload to deliver to the transport. */
export interface EventPublisher {
  publish(payload: EventPayload): Promise<void>;
  close?(): Promise<void>;
}

/** Consumer side: receives payloads and feeds them to the dispatch callback. */
export interface EventSubscriber {
  start(dispatch: (payload: EventPayload) => Promise<void>): Promise<void> | void;
  stop(): Promise<void>;
}

export interface EventTransport {
  /** Which provider built this transport — for logging and health reporting. */
  provider: EventBusProvider;
  publisher: EventPublisher;
  subscriber?: EventSubscriber;
}

/**
 * Lazily load an optional peer SDK. Cloud providers do not add their SDK as a
 * hard dependency — it is only required when the provider is configured.
 */
export async function loadProviderSdk<T>(packageName: string, provider: EventBusProvider): Promise<T> {
  try {
    return (await import(packageName)) as T;
  } catch {
    throw new Error(
      `EVENT_BUS_PROVIDER=${provider} requires the optional package "${packageName}". ` + `Install it with: yarn add ${packageName}`,
    );
  }
}
