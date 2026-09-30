/**
 * GCP Pub/Sub Event Provider
 *
 * Publisher: publishes JSON payloads to a Pub/Sub topic with eventType /
 * correlationId message attributes for filtering.
 * Subscriber: pull subscription message listener — ack on successful
 * dispatch, nack on failure (redelivery / dead-letter policy is configured
 * on the subscription in infra).
 *
 * Config:
 *   GCP_PUBSUB_TOPIC          (required) topic name or full resource path
 *   GCP_PUBSUB_SUBSCRIPTION   (required for consumers) subscription name
 *   GOOGLE_CLOUD_PROJECT      (optional) project id if not on GCP metadata
 *
 * Requires optional peer dep: @google-cloud/pubsub
 */

import type { EventPayload } from '../eventTypes';
import { loadProviderSdk, type EventTransport } from '../eventTransport';
import { logger } from '../../logger';

// Minimal structural types — the real SDK is an optional peer dependency.
interface PubSubMessage {
  data: Buffer;
  ack(): void;
  nack(): void;
}
interface PubSubSubscriptionLike {
  on(event: 'message', handler: (msg: PubSubMessage) => void): unknown;
  close(): Promise<void>;
}
interface PubSubTopicLike {
  publishMessage(options: { data: Buffer; attributes?: Record<string, string> }): Promise<string>;
}
interface PubSubLike {
  topic(name: string): PubSubTopicLike;
  subscription(name: string): PubSubSubscriptionLike;
  close?(): Promise<void>;
}

export interface GcpPubSubDeps {
  /** Inject a prebuilt client (tests). Defaults to lazy-loaded SDK. */
  client?: PubSubLike;
}

export async function createGcpPubSubTransport(env: NodeJS.ProcessEnv = process.env, deps: GcpPubSubDeps = {}): Promise<EventTransport> {
  const topicName = env.GCP_PUBSUB_TOPIC;
  if (!topicName) {
    throw new Error('EVENT_BUS_PROVIDER=gcp-pubsub requires GCP_PUBSUB_TOPIC');
  }

  const client =
    deps.client ??
    new (await loadProviderSdk<{ PubSub: new (o?: { projectId?: string }) => PubSubLike }>('@google-cloud/pubsub', 'gcp-pubsub')).PubSub(
      env.GOOGLE_CLOUD_PROJECT ? { projectId: env.GOOGLE_CLOUD_PROJECT } : undefined,
    );

  const topic = client.topic(topicName);

  return {
    publisher: {
      async publish(payload) {
        await topic.publishMessage({
          data: Buffer.from(JSON.stringify(payload)),
          attributes: {
            eventType: payload.type,
            ...(payload.correlationId ? { correlationId: payload.correlationId } : {}),
          },
        });
        logger.debug('Event published to Pub/Sub', { type: payload.type, topic: topicName });
      },
      async close() {
        await client.close?.();
      },
    },
    subscriber: env.GCP_PUBSUB_SUBSCRIPTION
      ? {
          start(dispatch) {
            const subscription = client.subscription(env.GCP_PUBSUB_SUBSCRIPTION!);
            subscription.on('message', async (msg: PubSubMessage) => {
              try {
                await dispatch(JSON.parse(msg.data.toString()) as EventPayload);
                msg.ack();
              } catch (err: unknown) {
                logger.error('Pub/Sub event dispatch failed; nacking', {
                  error: (err as Error).message,
                });
                msg.nack();
              }
            });
            logger.info('Pub/Sub subscriber started', {
              subscription: env.GCP_PUBSUB_SUBSCRIPTION,
            });
          },
          async stop() {
            await client.subscription(env.GCP_PUBSUB_SUBSCRIPTION!).close();
          },
        }
      : undefined,
  };
}
