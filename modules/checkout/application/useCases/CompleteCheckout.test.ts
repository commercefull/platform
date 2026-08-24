/**
 * Unit Tests for CompleteCheckout Use Case
 */

import { CompleteCheckoutUseCase, CompleteCheckoutCommand } from './CompleteCheckout';
import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';

import type { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import type { OrderPlacementPort, OrderSnapshot } from '../../application/ports/OrderPlacementPort';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

function createMockCheckoutRepo(session: CheckoutSession | null = null): jest.Mocked<CheckoutRepository> {
  return {
    findById: jest.fn().mockResolvedValue(session),
    findByBasketId: jest.fn().mockResolvedValue(null),
    findActiveByCustomerId: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(session),
    delete: jest.fn().mockResolvedValue(undefined),
    findExpiredSessions: jest.fn().mockResolvedValue([]),
    markAsAbandoned: jest.fn().mockResolvedValue(undefined),
    getAvailableShippingMethods: jest.fn().mockResolvedValue([]),
    getAvailablePaymentMethods: jest.fn().mockResolvedValue([]),
    validateShippingAddress: jest.fn().mockResolvedValue({ valid: true, errors: [] }),
    calculateTax: jest.fn().mockResolvedValue(0),
    findByPaymentIntentId: jest.fn().mockResolvedValue(null),
  } as never as jest.Mocked<CheckoutRepository>;
}

function createMockOrderPort(order: OrderSnapshot | null = null): jest.Mocked<OrderPlacementPort> {
  return {
    createOrder: jest.fn(),
    findOrder: jest.fn().mockResolvedValue(order),
    updateOrderStatus: jest.fn().mockResolvedValue(undefined),
    cancelOrder: jest.fn().mockResolvedValue(undefined),
  } as never as jest.Mocked<OrderPlacementPort>;
}

describe('CompleteCheckoutUseCase', () => {
  it('should complete a processing checkout session', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    session.markPaymentAuthorized();
    const repo = createMockCheckoutRepo(session);
    const orderPort = createMockOrderPort({
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: 'processing',
      paymentStatus: 'paid',
    });
    const useCase = new CompleteCheckoutUseCase(repo, orderPort);

    const result = await useCase.execute(new CompleteCheckoutCommand('cs-1'));

    expect(result.checkoutId).toBe('cs-1');
    expect(result.status).toBe('completed');
    expect(result.orderId).toBe('order-1');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should return idempotent response when already completed', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    session.markPaymentAuthorized();
    session.complete();
    const repo = createMockCheckoutRepo(session);
    const useCase = new CompleteCheckoutUseCase(repo);

    const result = await useCase.execute(new CompleteCheckoutCommand('cs-1'));

    expect(result.status).toBe('completed');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when checkout session does not exist', async () => {
    const repo = createMockCheckoutRepo(null);
    const useCase = new CompleteCheckoutUseCase(repo);

    await expect(
      useCase.execute(new CompleteCheckoutCommand('nonexistent')),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when session is still active', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    const repo = createMockCheckoutRepo(session);
    const useCase = new CompleteCheckoutUseCase(repo);

    await expect(
      useCase.execute(new CompleteCheckoutCommand('cs-1')),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw NotFoundError when linked order not found', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    session.markPaymentAuthorized();
    const repo = createMockCheckoutRepo(session);
    const orderPort = createMockOrderPort(null);
    const useCase = new CompleteCheckoutUseCase(repo, orderPort);

    await expect(
      useCase.execute(new CompleteCheckoutCommand('cs-1')),
    ).rejects.toThrow(NotFoundError);
  });

  it('should throw BadRequestError when order is not processing/paid', async () => {
    const session = CheckoutSession.create({ id: 'cs-1', basketId: 'b-1' });
    session.setPaymentIntent('pi-1', 'order-1');
    session.markPaymentAuthorized();
    const repo = createMockCheckoutRepo(session);
    const orderPort = createMockOrderPort({
      orderId: 'order-1',
      orderNumber: 'ORD-001',
      status: 'pending',
      paymentStatus: 'pending',
    });
    const useCase = new CompleteCheckoutUseCase(repo, orderPort);

    await expect(
      useCase.execute(new CompleteCheckoutCommand('cs-1')),
    ).rejects.toThrow(BadRequestError);
  });
});
