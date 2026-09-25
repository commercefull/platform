/**
 * Tests for fulfillment event handlers — order.cancelled fulfillment teardown.
 *
 * When an order is cancelled, every open fulfillment must be cancelled via
 * CancelFulfillmentUseCase so domain transition rules and the
 * fulfillment.cancelled event are preserved. Terminal fulfillments
 * (delivered/shipped/cancelled/...) are left alone.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { Fulfillment, type FulfillmentStatus, type FulfillmentProps } from '../domain/entities/Fulfillment';
import { registerFulfillmentEventHandlers, type FulfillmentEventHandlerDeps } from './eventHandlers';
import type { IFulfillmentRepository } from '../domain/repositories/FulfillmentRepository';

jest.mock('../../../libs/db', () => ({
  __esModule: true,
  query: jest.fn(),
  queryOne: jest.fn(),
  withTransaction: jest.fn((cb: () => Promise<unknown>) => cb()),
}));

jest.mock('../../../libs/jobs/cronScheduler', () => ({
  __esModule: true,
  JobScheduler: { scheduleNotification: jest.fn() },
}));

jest.mock('./wired', () => ({
  __esModule: true,
  planFulfillmentUseCase: { execute: jest.fn() },
}));

function makeFulfillment(status: FulfillmentStatus, id: string): Fulfillment {
  const props: FulfillmentProps = {
    fulfillmentId: id,
    orderId: 'ord-1',
    orderNumber: 'ORD-001',
    sourceType: 'warehouse',
    sourceId: 'wh-1',
    status,
    shipFromAddress: { addressLine1: '123 St', city: 'Portland', postalCode: '97201', countryCode: 'US' },
    shipToAddress: { addressLine1: '456 Ave', city: 'Seattle', postalCode: '98101', countryCode: 'US' },
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };
  return Fulfillment.fromPersistence(props);
}

describe('Fulfillment event handlers: order.cancelled', () => {
  let fulfillments: jest.Mocked<IFulfillmentRepository>;
  let deps: FulfillmentEventHandlerDeps;

  beforeEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
    fulfillments = {
      findById: jest.fn(),
      findByOrderId: jest.fn().mockResolvedValue([]),
      save: jest.fn((f: Fulfillment) => Promise.resolve(f)),
    } as unknown as jest.Mocked<IFulfillmentRepository>;
    deps = {
      orders: { findById: jest.fn() },
      reservations: { consumeByOrder: jest.fn() },
      fulfillments,
    };
    registerFulfillmentEventHandlers(deps);
  });

  afterEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
  });

  it('should cancel an open fulfillment and emit fulfillment.cancelled', async () => {
    const pending = makeFulfillment('pending', 'ful-1');
    fulfillments.findByOrderId.mockResolvedValue([pending]);
    fulfillments.findById.mockResolvedValue(pending);

    const emitted: unknown[] = [];
    eventBus.registerHandler('fulfillment.cancelled', p => {
      emitted.push(p.data);
      return Promise.resolve();
    });

    await eventBus.emit('order.cancelled', { orderId: 'ord-1' });

    expect(fulfillments.findById).toHaveBeenCalledWith('ful-1');
    expect(fulfillments.save).toHaveBeenCalledWith(pending);
    expect(pending.status).toBe('cancelled');
    expect(emitted).toEqual([
      expect.objectContaining({ fulfillmentId: 'ful-1', orderId: 'ord-1', reason: 'Order cancelled' }),
    ]);
  });

  it('should not attempt to cancel delivered or shipped fulfillments', async () => {
    const delivered = makeFulfillment('delivered', 'ful-delivered');
    const shipped = makeFulfillment('shipped', 'ful-shipped');
    fulfillments.findByOrderId.mockResolvedValue([delivered, shipped]);

    await eventBus.emit('order.cancelled', { orderId: 'ord-1' });

    expect(fulfillments.findById).not.toHaveBeenCalled();
    expect(fulfillments.save).not.toHaveBeenCalled();
    expect(delivered.status).toBe('delivered');
    expect(shipped.status).toBe('shipped');
  });

  it('should do nothing when the order has no fulfillments', async () => {
    fulfillments.findByOrderId.mockResolvedValue([]);

    await eventBus.emit('order.cancelled', { orderId: 'ord-1' });

    expect(fulfillments.findById).not.toHaveBeenCalled();
    expect(fulfillments.save).not.toHaveBeenCalled();
  });

  it('should do nothing when the event carries no orderId', async () => {
    await eventBus.emit('order.cancelled', {});

    expect(fulfillments.findByOrderId).not.toHaveBeenCalled();
  });

  it('should continue cancelling other fulfillments when one fails', async () => {
    const missing = makeFulfillment('pending', 'ful-missing');
    const ok = makeFulfillment('pending', 'ful-ok');
    fulfillments.findByOrderId.mockResolvedValue([missing, ok]);
    fulfillments.findById.mockImplementation(async id => (id === 'ful-missing' ? null : ok));

    await eventBus.emit('order.cancelled', { orderId: 'ord-1' });

    expect(fulfillments.save).toHaveBeenCalledWith(ok);
    expect(ok.status).toBe('cancelled');
  });
});
