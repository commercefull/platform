/**
 * Tests for checkout event handlers (Published Language migration).
 *
 * Verifies that checkout.payment_captured and checkout.failed events
 * correctly update checkout session state, replacing the previous
 * synchronous ACL calls from the payment module.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { CheckoutSession } from '../domain/entities/CheckoutSession';
import { registerCheckoutEventHandlers } from '../application/eventHandlers';
import type { CheckoutRepository } from '../domain/repositories/CheckoutRepository';

describe('Checkout event handlers (Published Language)', () => {
  let repo: jest.Mocked<CheckoutRepository>;

  beforeEach(() => {
    eventBus['handlers'].clear();
    repo = {
      findById: jest.fn(),
      save: jest.fn(),
    } as unknown as jest.Mocked<CheckoutRepository>;
    registerCheckoutEventHandlers(repo);
  });

  afterEach(() => {
    eventBus['handlers'].clear();
    jest.clearAllMocks();
  });

  it('checkout.payment_captured should mark session as payment authorized', async () => {
    const session = CheckoutSession.create({ id: 'cs-test', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    repo.findById.mockResolvedValue(session);
    repo.save.mockResolvedValue(session);

    await eventBus.emit('checkout.payment_captured', {
      checkoutId: 'cs-test',
      orderId: 'order-1',
      paymentIntentId: 'pi-1',
    });

    expect(repo.findById).toHaveBeenCalledWith('cs-test');
    expect(repo.save).toHaveBeenCalledWith(session);
    expect(session.paymentStatus).toBe('authorized');
  });

  it('checkout.payment_captured should not throw if session not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      eventBus.emit('checkout.payment_captured', {
        checkoutId: 'cs-missing',
        orderId: 'order-1',
        paymentIntentId: 'pi-1',
      }),
    ).resolves.not.toThrow();

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('checkout.payment_captured should skip if no checkoutId', async () => {
    await eventBus.emit('checkout.payment_captured', {
      orderId: 'order-1',
      paymentIntentId: 'pi-1',
    });

    expect(repo.findById).not.toHaveBeenCalled();
  });

  it('checkout.failed should mark session as payment failed', async () => {
    const session = CheckoutSession.create({ id: 'cs-fail', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    repo.findById.mockResolvedValue(session);
    repo.save.mockResolvedValue(session);

    await eventBus.emit('checkout.failed', {
      checkoutId: 'cs-fail',
      orderId: 'order-1',
      reason: 'card declined',
    });

    expect(repo.findById).toHaveBeenCalledWith('cs-fail');
    expect(repo.save).toHaveBeenCalledWith(session);
    expect(session.paymentStatus).toBe('failed');
    expect(session.status).toBe('failed');
  });

  it('checkout.failed should not throw if session not found', async () => {
    repo.findById.mockResolvedValue(null);

    await expect(
      eventBus.emit('checkout.failed', {
        checkoutId: 'cs-missing',
        orderId: 'order-1',
        reason: 'timeout',
      }),
    ).resolves.not.toThrow();

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('checkout.failed should skip if no checkoutId', async () => {
    await eventBus.emit('checkout.failed', {
      orderId: 'order-1',
      reason: 'timeout',
    });

    expect(repo.findById).not.toHaveBeenCalled();
  });
});
