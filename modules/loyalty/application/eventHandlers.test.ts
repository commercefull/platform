/**
 * Tests for loyalty event handlers — order.completed points + tier upgrade.
 *
 * processOrderPoints re-evaluates the customer tier internally; the handler
 * must emit loyalty.tier_upgraded when the tier actually changed so
 * downstream subscribers (customer notification) fire.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { registerLoyaltyEventHandlers, type LoyaltyEventHandlerDeps } from './eventHandlers';
import { Order } from '../../order/domain/entities/Order';
import { OrderItem } from '../../order/domain/entities/OrderItem';
import { Money } from '../../order/domain/valueObjects/Money';
import type { LoyaltyTier } from '../domain/entities/LoyaltyModel';

jest.mock('../../../libs/jobs/cronScheduler', () => ({
  __esModule: true,
  JobScheduler: { scheduleNotification: jest.fn(), schedule: jest.fn() },
}));

const tier = (tierId: string, name: string): LoyaltyTier =>
  ({ tierId, name }) as unknown as LoyaltyTier;

function makeOrder(): Order {
  const order = Order.create({ orderId: 'ord-1', customerId: 'cust-1', customerEmail: 't@e.com' });
  order.addItem(
    OrderItem.create({
      orderItemId: 'oi-1',
      orderId: 'ord-1',
      productId: 'prod-1',
      sku: 'SKU-1',
      name: 'Widget',
      quantity: 1,
      unitPrice: Money.create(100, 'USD'),
    }),
  );
  return order;
}

describe('Loyalty event handlers: order.completed', () => {
  let points: {
    processOrderPoints: jest.Mock;
    findCustomerPointsWithTier: jest.Mock;
  };
  let orders: { findById: jest.Mock };

  const pointsRow = (tierId: string) => ({ loyaltyPointsId: 'lp-1', customerId: 'cust-1', tierId });

  beforeEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
    orders = { findById: jest.fn().mockResolvedValue(makeOrder()) };
    points = {
      processOrderPoints: jest.fn().mockResolvedValue(pointsRow('tier-silver')),
      findCustomerPointsWithTier: jest.fn(),
    };
    const deps: LoyaltyEventHandlerDeps = {
      orders: orders as unknown as LoyaltyEventHandlerDeps['orders'],
      points: points as unknown as LoyaltyEventHandlerDeps['points'],
    };
    registerLoyaltyEventHandlers(deps);
  });

  afterEach(() => {
    (eventBus as unknown as { handlers: Map<string, unknown> }).handlers.clear();
  });

  it('should emit loyalty.tier_upgraded when the tier changes after awarding points', async () => {
    points.findCustomerPointsWithTier
      .mockResolvedValueOnce({ points: pointsRow('tier-bronze'), tier: tier('tier-bronze', 'Bronze') })
      .mockResolvedValueOnce({ points: pointsRow('tier-silver'), tier: tier('tier-silver', 'Silver') });

    const emitted: Record<string, unknown>[] = [];
    eventBus.registerHandler('loyalty.tier_upgraded', p => {
      emitted.push(p.data as Record<string, unknown>);
      return Promise.resolve();
    });

    await eventBus.emit('order.completed', { orderId: 'ord-1', customerId: 'cust-1' });

    expect(points.processOrderPoints).toHaveBeenCalledWith('cust-1', 'ord-1', 100);
    expect(emitted).toEqual([
      expect.objectContaining({
        customerId: 'cust-1',
        previousTier: 'Bronze',
        newTier: 'Silver',
        tierId: 'tier-silver',
      }),
    ]);
  });

  it('should not emit loyalty.tier_upgraded when the tier is unchanged', async () => {
    const snapshot = { points: pointsRow('tier-silver'), tier: tier('tier-silver', 'Silver') };
    points.findCustomerPointsWithTier.mockResolvedValue(snapshot);

    const emitted: unknown[] = [];
    eventBus.registerHandler('loyalty.tier_upgraded', p => {
      emitted.push(p.data);
      return Promise.resolve();
    });

    await eventBus.emit('order.completed', { orderId: 'ord-1', customerId: 'cust-1' });

    expect(points.processOrderPoints).toHaveBeenCalled();
    expect(emitted).toHaveLength(0);
  });

  it('should emit loyalty.tier_upgraded for a first-time points customer (no prior tier)', async () => {
    points.findCustomerPointsWithTier
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ points: pointsRow('tier-bronze'), tier: tier('tier-bronze', 'Bronze') });

    const emitted: Record<string, unknown>[] = [];
    eventBus.registerHandler('loyalty.tier_upgraded', p => {
      emitted.push(p.data as Record<string, unknown>);
      return Promise.resolve();
    });

    await eventBus.emit('order.completed', { orderId: 'ord-1', customerId: 'cust-1' });

    expect(emitted).toEqual([
      expect.objectContaining({ customerId: 'cust-1', previousTier: undefined, newTier: 'Bronze' }),
    ]);
  });

  it('should do nothing when the order has no total', async () => {
    orders.findById.mockResolvedValue(Order.create({ orderId: 'ord-1', customerEmail: 't@e.com' }));

    await eventBus.emit('order.completed', { orderId: 'ord-1', customerId: 'cust-1' });

    expect(points.processOrderPoints).not.toHaveBeenCalled();
  });
});
