/**
 * Unit Tests for InitiateCheckout Use Case
 */

import { InitiateCheckoutUseCase, InitiateCheckoutCommand } from './InitiateCheckout';
import { CheckoutSession } from '../../domain/entities/CheckoutSession';
import { CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import { Money } from '../../../../libs/money';

import type { CheckoutRepository } from '../../domain/repositories/CheckoutRepository';
import type { BasketSnapshotPort, BasketSnapshot } from '../../application/ports/BasketSnapshotPort';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'checkout-uuid-123'),
}));

function createBasketSnapshot(overrides: Partial<BasketSnapshot> = {}): BasketSnapshot {
  return {
    basketId: 'b-1',
    currency: 'USD',
    isEmpty: false,
    itemCount: 2,
    uniqueItemCount: 2,
    subtotal: Money.create(100, 'USD'),
    discountAmount: 0,
    total: Money.create(100, 'USD'),
    items: [],
    ...overrides,
  };
}

function createMockBasketPort(snapshot: BasketSnapshot | null): jest.Mocked<BasketSnapshotPort> {
  return {
    getSnapshot: jest.fn().mockResolvedValue(snapshot),
  } as never as jest.Mocked<BasketSnapshotPort>;
}

function createMockCheckoutRepo(session: CheckoutSession | null = null): jest.Mocked<CheckoutRepository> {
  return {
    findById: jest.fn().mockResolvedValue(session),
    findByBasketId: jest.fn().mockResolvedValue(session),
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

describe('InitiateCheckoutUseCase', () => {
  it('should create a new checkout session from a valid basket', async () => {
    const snapshot = createBasketSnapshot();
    const basketPort = createMockBasketPort(snapshot);
    const repo = createMockCheckoutRepo(null);
    const useCase = new InitiateCheckoutUseCase(repo, basketPort);

    const result = await useCase.execute(new InitiateCheckoutCommand('b-1', 'cust-1'));

    expect(result.checkoutId).toBeDefined();
    expect(result.basketId).toBe('b-1');
    expect(result.customerId).toBe('cust-1');
    expect(result.status).toBe('active');
    expect(result.subtotal).toBe(100);
    expect(repo.save).toHaveBeenCalled();
  });

  it('should throw CheckoutValidationError when basket not found', async () => {
    const basketPort = createMockBasketPort(null);
    const repo = createMockCheckoutRepo(null);
    const useCase = new InitiateCheckoutUseCase(repo, basketPort);

    await expect(
      useCase.execute(new InitiateCheckoutCommand('nonexistent')),
    ).rejects.toThrow(CheckoutValidationError);
  });

  it('should throw CheckoutValidationError when basket is empty', async () => {
    const snapshot = createBasketSnapshot({ isEmpty: true });
    const basketPort = createMockBasketPort(snapshot);
    const repo = createMockCheckoutRepo(null);
    const useCase = new InitiateCheckoutUseCase(repo, basketPort);

    await expect(
      useCase.execute(new InitiateCheckoutCommand('b-1')),
    ).rejects.toThrow(CheckoutValidationError);
  });

  it('should extend expiration when an active session already exists', async () => {
    const snapshot = createBasketSnapshot();
    const basketPort = createMockBasketPort(snapshot);
    const existingSession = CheckoutSession.create({ id: 'existing-1', basketId: 'b-1' });
    const repo = createMockCheckoutRepo(existingSession);
    const useCase = new InitiateCheckoutUseCase(repo, basketPort);

    const result = await useCase.execute(new InitiateCheckoutCommand('b-1'));

    expect(result.checkoutId).toBe('existing-1');
    expect(repo.save).toHaveBeenCalled();
  });
});
