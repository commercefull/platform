import { eventBus, EventPayload } from './eventBus';

describe('EventBus error boundaries', () => {
  afterEach(() => {
    // Clean up handlers between tests
    eventBus['handlers'].clear();
  });

  it('emit() should not throw when a handler throws', async () => {
    const throwingHandler = jest.fn().mockRejectedValue(new Error('handler boom'));
    const goodHandler = jest.fn().mockResolvedValue(undefined);

    eventBus.registerHandler('order.created', throwingHandler);
    eventBus.registerHandler('order.created', goodHandler);

    await expect(eventBus.emit('order.created', { orderId: '123' })).resolves.not.toThrow();

    expect(throwingHandler).toHaveBeenCalledTimes(1);
    expect(goodHandler).toHaveBeenCalledTimes(1);
  });

  it('emit() should continue calling remaining handlers after one throws', async () => {
    const handler1 = jest.fn().mockRejectedValue(new Error('first fails'));
    const handler2 = jest.fn().mockResolvedValue(undefined);
    const handler3 = jest.fn().mockResolvedValue(undefined);

    eventBus.registerHandler('product.created', handler1);
    eventBus.registerHandler('product.created', handler2);
    eventBus.registerHandler('product.created', handler3);

    await eventBus.emit('product.created', { productId: 'p1' });

    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
    expect(handler3).toHaveBeenCalledTimes(1);
  });

  it('dispatchFromOutbox() should throw when any handler fails', async () => {
    const goodHandler = jest.fn().mockResolvedValue(undefined);
    const badHandler = jest.fn().mockRejectedValue(new Error('outbox handler fail'));

    eventBus.registerHandler('order.paid', goodHandler);
    eventBus.registerHandler('order.paid', badHandler);

    const payload: EventPayload = {
      type: 'order.paid',
      data: { orderId: 'o1' },
      timestamp: new Date(),
      correlationId: 'corr-1',
    };

    await expect(eventBus.dispatchFromOutbox(payload)).rejects.toThrow('Outbox dispatch failed');
  });

  it('dispatchFromOutbox() should not throw when all handlers succeed', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    eventBus.registerHandler('order.shipped', handler);

    const payload: EventPayload = {
      type: 'order.shipped',
      data: { orderId: 'o1' },
      timestamp: new Date(),
    };

    await expect(eventBus.dispatchFromOutbox(payload)).resolves.not.toThrow();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dispatchFromOutbox() should call all handlers even if some fail', async () => {
    const handler1 = jest.fn().mockRejectedValue(new Error('fail 1'));
    const handler2 = jest.fn().mockResolvedValue(undefined);

    eventBus.registerHandler('payment.failed', handler1);
    eventBus.registerHandler('payment.failed', handler2);

    const payload: EventPayload = {
      type: 'payment.failed',
      data: { orderId: 'o1' },
      timestamp: new Date(),
    };

    await expect(eventBus.dispatchFromOutbox(payload)).rejects.toThrow();
    expect(handler1).toHaveBeenCalledTimes(1);
    expect(handler2).toHaveBeenCalledTimes(1);
  });

  it('setOutboxMode / isOutboxMode', () => {
    expect(eventBus.isOutboxMode()).toBe(false);
    eventBus.setOutboxMode(true);
    expect(eventBus.isOutboxMode()).toBe(true);
    eventBus.setOutboxMode(false);
    expect(eventBus.isOutboxMode()).toBe(false);
  });
});
