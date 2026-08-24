/**
 * Tests for checkout event handlers (Published Language migration).
 *
 * Verifies that checkout.payment_captured and checkout.failed events
 * correctly update checkout session state, replacing the previous
 * synchronous ACL calls from the payment module.
 */

import { eventBus } from '../../../libs/events/eventBus';
import { CheckoutSession } from '../domain/entities/CheckoutSession';

// Mock the CheckoutRepository
jest.mock('../infrastructure/repositories/CheckoutRepository', () => {
  const mockSession = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
  mockSession.setPaymentIntent('pi-1', 'order-1');

  return {
    __esModule: true,
    default: {
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(mockSession),
    },
  };
});

import CheckoutRepo from '../infrastructure/repositories/CheckoutRepository';
import { registerCheckoutEventHandlers } from '../application/eventHandlers';

describe('Checkout event handlers (Published Language)', () => {
  beforeEach(() => {
    // Clear handlers before each test
    eventBus['handlers'].clear();
    registerCheckoutEventHandlers(CheckoutRepo);
  });

  afterEach(() => {
    eventBus['handlers'].clear();
    jest.clearAllMocks();
  });

  it('checkout.payment_captured should mark session as payment authorized', async () => {
    const session = CheckoutSession.create({ id: 'cs-test', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    (CheckoutRepo.findById as jest.Mock).mockResolvedValue(session);

    await eventBus.emit('checkout.payment_captured', {
      checkoutId: 'cs-test',
      orderId: 'order-1',
      paymentIntentId: 'pi-1',
    });

    expect(CheckoutRepo.findById).toHaveBeenCalledWith('cs-test');
    expect(CheckoutRepo.save).toHaveBeenCalledWith(session);
    expect(session.paymentStatus).toBe('authorized');
  });

  it('checkout.payment_captured should not throw if session not found', async () => {
    (CheckoutRepo.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      eventBus.emit('checkout.payment_captured', {
        checkoutId: 'cs-missing',
        orderId: 'order-1',
        paymentIntentId: 'pi-1',
      }),
    ).resolves.not.toThrow();

    expect(CheckoutRepo.save).not.toHaveBeenCalled();
  });

  it('checkout.payment_captured should skip if no checkoutId', async () => {
    await eventBus.emit('checkout.payment_captured', {
      orderId: 'order-1',
      paymentIntentId: 'pi-1',
    });

    expect(CheckoutRepo.findById).not.toHaveBeenCalled();
  });

  it('checkout.failed should mark session as payment failed', async () => {
    const session = CheckoutSession.create({ id: 'cs-fail', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    (CheckoutRepo.findById as jest.Mock).mockResolvedValue(session);

    await eventBus.emit('checkout.failed', {
      checkoutId: 'cs-fail',
      orderId: 'order-1',
      reason: 'card declined',
    });

    expect(CheckoutRepo.findById).toHaveBeenCalledWith('cs-fail');
    expect(CheckoutRepo.save).toHaveBeenCalledWith(session);
    expect(session.paymentStatus).toBe('failed');
    expect(session.status).toBe('failed');
  });

  it('checkout.failed should not throw if session not found', async () => {
    (CheckoutRepo.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      eventBus.emit('checkout.failed', {
        checkoutId: 'cs-missing',
        orderId: 'order-1',
        reason: 'timeout',
      }),
    ).resolves.not.toThrow();

    expect(CheckoutRepo.save).not.toHaveBeenCalled();
  });

  it('checkout.failed should skip if no checkoutId', async () => {
    await eventBus.emit('checkout.failed', {
      orderId: 'order-1',
      reason: 'timeout',
    });

    expect(CheckoutRepo.findById).not.toHaveBeenCalled();
  });
});
