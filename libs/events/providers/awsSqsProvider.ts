/**
 * AWS SQS Event Provider
 *
 * Publisher: SendMessage to the events queue (eventType as a message
 * attribute for filtering).
 * Subscriber: SQS long-poll consumer — delete on success, leave on failure
 * so the visibility timeout expires and the queue's redrive policy
 * (configured in infra) routes to the dead-letter queue.
 *
 * Config:
 *   AWS_EVENT_QUEUE_URL   (required) SQS queue URL — same queue for
 *                         publishing and consuming; set it on workers only
 *                         for publish-only nodes use AWS_EVENT_QUEUE_URL too
 *   AWS_REGION            (required) e.g. us-east-1
 *
 * Requires optional peer dep: @aws-sdk/client-sqs
 */

import type { EventPayload } from '../eventTypes';
import { loadProviderSdk, type EventTransport } from '../eventTransport';
import { logger } from '../../logger';

// Minimal structural type — the real SDK is an optional peer dependency.
interface SqsClientLike {
  send(command: { input: Record<string, unknown> }): Promise<{
    Messages?: Array<{ Body?: string; ReceiptHandle?: string }>;
  }>;
  destroy(): void;
}

export interface AwsSqsDeps {
  /** Inject a prebuilt client (tests). Defaults to lazy-loaded SDK. */
  sqs?: SqsClientLike;
}

const POLL_WAIT_SECONDS = 20;
const MAX_MESSAGES = 10;

export async function createAwsSqsTransport(env: NodeJS.ProcessEnv = process.env, deps: AwsSqsDeps = {}): Promise<EventTransport> {
  const queueUrl = env.AWS_EVENT_QUEUE_URL;
  if (!queueUrl) {
    throw new Error('EVENT_BUS_PROVIDER=aws-sqs requires AWS_EVENT_QUEUE_URL');
  }

  const region = env.AWS_REGION || env.AWS_DEFAULT_REGION;

  const sqs =
    deps.sqs ??
    new (await loadProviderSdk<{ SQSClient: new (o?: { region?: string }) => SqsClientLike }>('@aws-sdk/client-sqs', 'aws-sqs')).SQSClient(
      region ? { region } : undefined,
    );

  let stopping = false;
  let pollTimer: NodeJS.Timeout | null = null;

  return {
    publisher: {
      async publish(payload) {
        await sqs.send({
          input: {
            QueueUrl: queueUrl,
            MessageBody: JSON.stringify(payload),
            MessageAttributes: {
              eventType: { DataType: 'String', StringValue: payload.type },
            },
          },
        });
        logger.debug('Event published to SQS', { type: payload.type, queueUrl });
      },
      async close() {
        sqs.destroy();
      },
    },
    subscriber: {
      start(dispatch) {
        stopping = false;

        const poll = async () => {
          if (stopping) return;
          try {
            const result = await sqs.send({
              input: {
                QueueUrl: queueUrl,
                MaxNumberOfMessages: MAX_MESSAGES,
                WaitTimeSeconds: POLL_WAIT_SECONDS,
                VisibilityTimeout: 60,
              },
            });

            for (const msg of result.Messages ?? []) {
              try {
                await dispatch(JSON.parse(msg.Body ?? '{}') as EventPayload);
                await sqs.send({
                  input: { QueueUrl: queueUrl, ReceiptHandle: msg.ReceiptHandle },
                });
              } catch (err: unknown) {
                // Leave the message — visibility timeout redelivers it and
                // the queue redrive policy moves it to the DLQ eventually.
                logger.error('SQS event dispatch failed; leaving for redelivery', {
                  error: (err as Error).message,
                });
              }
            }
          } catch (err: unknown) {
            logger.error('SQS poll error', { error: (err as Error).message });
          }
          if (!stopping) pollTimer = setTimeout(poll, 0);
        };

        poll();
        logger.info('SQS subscriber started', { queueUrl });
      },
      async stop() {
        stopping = true;
        if (pollTimer) clearTimeout(pollTimer);
      },
    },
  };
}
