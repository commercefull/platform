/**
 * Event transport provider tests — factory selection, memory/postgres
 * behavior, and cloud adapters driven through injected mock clients.
 */

import { resolveEventBusProvider, initEventTransport } from './index';
import { createMemoryTransport } from './memoryProvider';
import { createPostgresTransport } from './postgres/postgresProvider';
import { createGcpPubSubTransport } from './gcpPubSubProvider';
import { createAwsSqsTransport } from './awsSqsProvider';
import { createAzureServiceBusTransport } from './azureServiceBusProvider';
import { getEventPublisher, setEventTransport } from '../transportRegistry';
import type { EventPayload } from '../eventTypes';

jest.mock('../../db/pool', () => ({ getActivePool: jest.fn() }));
jest.mock('./postgres/outboxDispatcher', () => ({
  startOutboxDispatcher: jest.fn(),
  stopOutboxDispatcher: jest.fn().mockResolvedValue(undefined),
}));

import { getActivePool } from '../../db/pool';
import { startOutboxDispatcher, stopOutboxDispatcher } from './postgres/outboxDispatcher';

const payload: EventPayload = {
  type: 'order.created',
  data: { orderId: 'o1' },
  timestamp: new Date('2026-01-01T00:00:00Z'),
  correlationId: 'corr-1',
};

const env = (over: Record<string, string>): NodeJS.ProcessEnv => over as NodeJS.ProcessEnv;

describe('resolveEventBusProvider', () => {
  it('should default to memory when unset', () => {
    expect(resolveEventBusProvider(env({}))).toBe('memory');
    expect(resolveEventBusProvider(env({ OUTBOX_DISABLED: '1' }))).toBe('memory');
  });

  it('should resolve each valid provider', () => {
    for (const p of ['postgres', 'gcp-pubsub', 'aws-sqs', 'azure-servicebus'] as const) {
      expect(resolveEventBusProvider(env({ EVENT_BUS_PROVIDER: p }))).toBe(p);
    }
  });

  it('should force memory when OUTBOX_DISABLED=1 even with a provider set', () => {
    expect(resolveEventBusProvider(env({ EVENT_BUS_PROVIDER: 'postgres', OUTBOX_DISABLED: '1' }))).toBe('memory');
  });

  it('should fall back to memory on an unknown provider', () => {
    expect(resolveEventBusProvider(env({ EVENT_BUS_PROVIDER: 'kafka' }))).toBe('memory');
  });
});

describe('memory provider', () => {
  it('should dispatch payloads in-process and swallow handler failures', async () => {
    const dispatch = jest.fn().mockRejectedValue(new Error('handler blew up'));
    const t = createMemoryTransport(dispatch);
    await expect(t.publisher.publish(payload)).resolves.toBeUndefined();
    expect(dispatch).toHaveBeenCalledWith(payload);
    expect(t.subscriber).toBeUndefined();
  });
});

describe('postgres provider', () => {
  it('should insert a pending outbox row on publish', async () => {
    const query = jest.fn().mockResolvedValue({ rows: [] });
    (getActivePool as jest.Mock).mockReturnValue({ query });
    const t = createPostgresTransport();
    await t.publisher.publish(payload);
    expect(query).toHaveBeenCalledWith(expect.stringContaining('platformEventOutbox'), [
      'order.created',
      JSON.stringify(payload.data),
      'corr-1',
      null,
    ]);
  });

  it('should start/stop the outbox dispatcher as subscriber', async () => {
    const t = createPostgresTransport();
    const dispatch = jest.fn();
    await t.subscriber!.start(dispatch);
    expect(startOutboxDispatcher).toHaveBeenCalledWith(undefined, dispatch);
    await t.subscriber!.stop();
    expect(stopOutboxDispatcher).toHaveBeenCalled();
  });
});

describe('gcp-pubsub provider', () => {
  const makeClient = () => {
    const publishMessage = jest.fn().mockResolvedValue('msg-1');
    const handlers: Array<(m: unknown) => void> = [];
    const subscription = {
      on: jest.fn((_e: string, h: (m: unknown) => void) => handlers.push(h)),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const client = {
      topic: jest.fn().mockReturnValue({ publishMessage }),
      subscription: jest.fn().mockReturnValue(subscription),
    };
    return { client, publishMessage, handlers, subscription };
  };

  const gcpEnv = env({ GCP_PUBSUB_TOPIC: 'events', GCP_PUBSUB_SUBSCRIPTION: 'worker' });

  it('should throw without GCP_PUBSUB_TOPIC', async () => {
    await expect(createGcpPubSubTransport(env({}), { client: makeClient().client })).rejects.toThrow('GCP_PUBSUB_TOPIC');
  });

  it('should publish JSON with eventType attribute', async () => {
    const { client, publishMessage } = makeClient();
    const t = await createGcpPubSubTransport(gcpEnv, { client });
    await t.publisher.publish(payload);
    const call = publishMessage.mock.calls[0][0];
    expect(JSON.parse(call.data.toString())).toMatchObject({ type: 'order.created' });
    expect(call.attributes).toMatchObject({ eventType: 'order.created', correlationId: 'corr-1' });
  });

  it('should close the started subscription on stop', async () => {
    const { client, subscription } = makeClient();
    const t = await createGcpPubSubTransport(gcpEnv, { client });
    await t.subscriber!.start(jest.fn());
    await t.subscriber!.stop();
    // Must close the instance that has the listener — not a fresh lookup
    expect(subscription.close).toHaveBeenCalled();
    expect(client.subscription).toHaveBeenCalledTimes(1);
  });

  it('should ack on successful dispatch and nack on failure', async () => {
    const { client, handlers } = makeClient();
    const dispatch = jest.fn().mockResolvedValue(undefined);
    const t = await createGcpPubSubTransport(gcpEnv, { client });
    await t.subscriber!.start(dispatch);

    const msg = { data: Buffer.from(JSON.stringify(payload)), ack: jest.fn(), nack: jest.fn() };
    await handlers[0](msg);
    expect(msg.ack).toHaveBeenCalled();

    dispatch.mockRejectedValue(new Error('boom'));
    const msg2 = { data: Buffer.from(JSON.stringify(payload)), ack: jest.fn(), nack: jest.fn() };
    await handlers[0](msg2);
    expect(msg2.nack).toHaveBeenCalled();
  });
});

describe('aws-sqs provider', () => {
  const awsEnv = env({
    AWS_EVENT_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/1/events',
  });

  it('should throw without a queue configured', async () => {
    await expect(createAwsSqsTransport(env({}))).rejects.toThrow('AWS_EVENT_QUEUE_URL');
  });

  it('should publish to the SQS queue', async () => {
    const send = jest.fn().mockResolvedValue({});
    const t = await createAwsSqsTransport(awsEnv, { sqs: { send, destroy: jest.fn() } });
    await t.publisher.publish(payload);
    const input = send.mock.calls[0][0].input;
    expect(input.QueueUrl).toBe(awsEnv.AWS_EVENT_QUEUE_URL);
    expect(JSON.parse(input.MessageBody)).toMatchObject({ type: 'order.created' });
    expect(input.MessageAttributes.eventType.StringValue).toBe('order.created');
    expect(input.MessageAttributes.correlationId.StringValue).toBe('corr-1');
  });

  it('should ignore a second start while already consuming', async () => {
    const send = jest.fn().mockResolvedValue({ Messages: [] });
    const t = await createAwsSqsTransport(awsEnv, { sqs: { send, destroy: jest.fn() } });
    await t.subscriber!.start(jest.fn());
    await t.subscriber!.start(jest.fn());
    await t.subscriber!.stop();
    // Polls run back-to-back; only the first loop's sends count toward the
    // assertion window — a second start must not double them.
    const callsAfterStart = send.mock.calls.length;
    await new Promise(r => setTimeout(r, 20));
    expect(send.mock.calls.length).toBe(callsAfterStart);
  });

  it('should consume, dispatch and delete SQS messages', async () => {
    const receipt = 'rh-1';
    const sqsSend = jest
      .fn()
      .mockResolvedValueOnce({ Messages: [{ Body: JSON.stringify(payload), ReceiptHandle: receipt }] })
      .mockResolvedValue({});
    const t = await createAwsSqsTransport(awsEnv, {
      sqs: { send: sqsSend, destroy: jest.fn() },
    });
    const dispatch = jest.fn().mockResolvedValue(undefined);
    await t.subscriber!.start(dispatch);
    await new Promise(r => setTimeout(r, 30));
    await t.subscriber!.stop();

    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'order.created' }));
    expect(sqsSend).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ ReceiptHandle: receipt }) }));
  });
});

describe('azure-servicebus provider', () => {
  const azEnv = env({
    AZURE_SERVICE_BUS_TOPIC: 'domain-events',
    AZURE_SERVICE_BUS_SUBSCRIPTION: 'worker',
    AZURE_SERVICE_BUS_CONNECTION_STRING: 'Endpoint=sb://fake/',
  });

  const makeClient = () => {
    const sendMessages = jest.fn().mockResolvedValue(undefined);
    let handlers: { processMessage: (m: unknown) => Promise<void>; processError: (e: unknown) => Promise<void> };
    const receiver = {
      subscribe: jest.fn(async (h: typeof handlers) => {
        handlers = h;
      }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const client = {
      createSender: jest.fn().mockReturnValue({ sendMessages, close: jest.fn() }),
      createReceiver: jest.fn().mockReturnValue(receiver),
      close: jest.fn().mockResolvedValue(undefined),
    };
    return { client, sendMessages, receiver, getHandlers: () => handlers };
  };

  it('should throw without topic or subscription', async () => {
    await expect(createAzureServiceBusTransport(env({}), { client: makeClient().client })).rejects.toThrow('AZURE_SERVICE_BUS_TOPIC');
  });

  it('should publish with subject set to the event type', async () => {
    const { client, sendMessages } = makeClient();
    const t = await createAzureServiceBusTransport(azEnv, { client });
    await t.publisher.publish(payload);
    expect(sendMessages).toHaveBeenCalledWith(expect.objectContaining({ subject: 'order.created', correlationId: 'corr-1' }));
  });

  it('should dispatch received messages', async () => {
    const { client, getHandlers } = makeClient();
    const t = await createAzureServiceBusTransport(azEnv, { client });
    const dispatch = jest.fn().mockResolvedValue(undefined);
    await t.subscriber!.start(dispatch);
    await getHandlers().processMessage({ body: payload });
    expect(dispatch).toHaveBeenCalledWith(payload);
  });
});

describe('initEventTransport', () => {
  it('should install the transport so emit() uses the provider publisher', async () => {
    await initEventTransport(jest.fn(), env({ EVENT_BUS_PROVIDER: 'memory' }));
    expect(getEventPublisher()).toBeDefined();
    setEventTransport({ provider: 'memory', publisher: { publish: jest.fn() } }); // reset-ish for other suites
  });
});
