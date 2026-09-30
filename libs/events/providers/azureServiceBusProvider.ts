/**
 * Azure Service Bus Event Provider
 *
 * Publisher: sends JSON messages to a Service Bus topic with the event
 * type in `subject` for subscription filters.
 * Subscriber: receiver subscribe() — complete on success, abandon on
 * failure (redelivery; dead-lettering after maxDeliveryCount is
 * configured on the subscription in infra).
 *
 * Config:
 *   AZURE_SERVICE_BUS_CONNECTION_STRING  (required) or use managed identity
 *                                        via AZURE_SERVICE_BUS_NAMESPACE
 *   AZURE_SERVICE_BUS_TOPIC              (required for publishers)
 *   AZURE_SERVICE_BUS_SUBSCRIPTION       (required for consumers)
 *
 * Requires optional peer dep: @azure/service-bus
 */

import type { EventPayload } from '../eventTypes';
import { loadProviderSdk, type EventTransport } from '../eventTransport';
import { logger } from '../../logger';

// Minimal structural types — the real SDK is an optional peer dependency.
interface ServiceBusSenderLike {
  sendMessages(message: { body: unknown; subject?: string; correlationId?: string }): Promise<void>;
  close(): Promise<void>;
}
interface ServiceBusReceivedMessageLike {
  body: unknown;
}
interface ServiceBusReceiverLike {
  subscribe(handlers: {
    processMessage(m: ServiceBusReceivedMessageLike): Promise<void>;
    processError(e: unknown): Promise<void>;
  }): Promise<void>;
  close(): Promise<void>;
}
interface ServiceBusClientLike {
  createSender(name: string): ServiceBusSenderLike;
  createReceiver(topic: string, subscription: string): ServiceBusReceiverLike;
  close(): Promise<void>;
}

export interface AzureServiceBusDeps {
  client?: ServiceBusClientLike;
}

export async function createAzureServiceBusTransport(
  env: NodeJS.ProcessEnv = process.env,
  deps: AzureServiceBusDeps = {},
): Promise<EventTransport> {
  const topic = env.AZURE_SERVICE_BUS_TOPIC;
  const subscription = env.AZURE_SERVICE_BUS_SUBSCRIPTION;
  const connectionString = env.AZURE_SERVICE_BUS_CONNECTION_STRING;

  if (!topic && !subscription) {
    throw new Error('EVENT_BUS_PROVIDER=azure-servicebus requires AZURE_SERVICE_BUS_TOPIC and/or AZURE_SERVICE_BUS_SUBSCRIPTION');
  }

  let client = deps.client;
  if (!client) {
    const { ServiceBusClient } = await loadProviderSdk<{
      ServiceBusClient: new (connectionString: string) => ServiceBusClientLike;
    }>('@azure/service-bus', 'azure-servicebus');

    if (!connectionString) {
      throw new Error('azure-servicebus requires AZURE_SERVICE_BUS_CONNECTION_STRING');
    }
    client = new ServiceBusClient(connectionString);
  }

  const sender = topic ? client.createSender(topic) : null;
  let receiver: ServiceBusReceiverLike | null = null;

  const transport: EventTransport = {
    publisher: {
      async publish(payload) {
        if (!sender) {
          throw new Error('azure-servicebus publisher requires AZURE_SERVICE_BUS_TOPIC');
        }
        await sender.sendMessages({
          body: payload,
          subject: payload.type,
          correlationId: payload.correlationId,
        });
        logger.debug('Event published to Service Bus', { type: payload.type, topic });
      },
      async close() {
        await receiver?.close();
        await sender?.close();
        await client!.close();
      },
    },
  };

  if (topic && subscription) {
    transport.subscriber = {
      async start(dispatch) {
        receiver = client!.createReceiver(topic, subscription);
        await receiver.subscribe({
          async processMessage(message) {
            await dispatch(message.body as EventPayload);
            // ServiceBusClient auto-completes when processMessage resolves;
            // a thrown error abandons the message for redelivery → DLQ.
          },
          async processError(err) {
            logger.error('Service Bus receiver error', {
              error: (err as Error)?.message ?? String(err),
            });
          },
        });
        logger.info('Service Bus subscriber started', { topic, subscription });
      },
      async stop() {
        await receiver?.close();
      },
    };
  }

  return transport;
}
