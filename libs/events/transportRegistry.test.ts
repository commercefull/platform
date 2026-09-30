/**
 * Transport registry lifecycle tests — in-memory fallback, transport
 * installation, and shutdown ordering.
 */

import {
  getEventPublisher,
  setEventDispatch,
  setEventTransport,
  startEventSubscriber,
  stopEventTransport,
} from './transportRegistry';
import type { EventPayload } from './eventTypes';
import type { EventTransport } from './eventTransport';

const payload: EventPayload = {
  type: 'order.created',
  data: { orderId: 'o1' },
  timestamp: new Date(),
};

describe('transportRegistry', () => {
  beforeEach(() => {
    setEventTransport(null as unknown as EventTransport);
    setEventDispatch(jest.fn().mockResolvedValue(undefined));
  });

  afterEach(async () => {
    setEventTransport(null as unknown as EventTransport);
    setEventDispatch(jest.fn().mockResolvedValue(undefined));
  });

  describe('memory fallback (no transport installed)', () => {
    it('should dispatch in-process through the registered dispatch fn', async () => {
      const dispatch = jest.fn().mockResolvedValue(undefined);
      setEventDispatch(dispatch);

      await getEventPublisher().publish(payload);
      expect(dispatch).toHaveBeenCalledWith(payload);
    });

    it('should swallow dispatch errors like the historical emit path', async () => {
      setEventDispatch(jest.fn().mockRejectedValue(new Error('boom')));
      await expect(getEventPublisher().publish(payload)).resolves.toBeUndefined();
    });
  });

  describe('installed transport', () => {
    it('should publish through the transport publisher', async () => {
      const publish = jest.fn().mockResolvedValue(undefined);
      setEventTransport({ provider: 'memory', publisher: { publish } });

      await getEventPublisher().publish(payload);
      expect(publish).toHaveBeenCalledWith(payload);
    });

    it('should start the subscriber with the registered dispatch fn', async () => {
      const start = jest.fn().mockResolvedValue(undefined);
      const dispatch = jest.fn().mockResolvedValue(undefined);
      setEventDispatch(dispatch);
      setEventTransport({ provider: 'postgres', publisher: { publish: jest.fn() }, subscriber: { start, stop: jest.fn() } });

      await startEventSubscriber();
      expect(start).toHaveBeenCalledWith(dispatch);
    });

    it('should no-op start when the transport has no subscriber', async () => {
      setEventTransport({ provider: 'memory', publisher: { publish: jest.fn() } });
      await expect(startEventSubscriber()).resolves.toBeUndefined();
    });

    it('should stop subscriber before closing the publisher', async () => {
      const order: string[] = [];
      setEventTransport({
        provider: 'aws-sqs',
        publisher: { publish: jest.fn(), close: jest.fn(async () => void order.push('close')) },
        subscriber: { start: jest.fn(), stop: jest.fn(async () => void order.push('stop')) },
      });

      await stopEventTransport();
      expect(order).toEqual(['stop', 'close']);
    });
  });
});
