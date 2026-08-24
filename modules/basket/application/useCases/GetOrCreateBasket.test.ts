/**
 * Unit Tests for GetOrCreateBasket Use Case
 */

import { GetOrCreateBasketUseCase, GetOrCreateBasketCommand } from './GetOrCreateBasket';
import { Basket } from '../../domain/entities/Basket';

import type { BasketRepository } from '../../domain/repositories/BasketRepository';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'basket-uuid-123'),
}));

function createBasket(): Basket {
  return Basket.create({ basketId: 'b-1', customerId: 'cust-1', currency: 'USD' });
}

function createMockBasketRepo(basket: Basket | null = null): jest.Mocked<BasketRepository> {
  return {
    findById: jest.fn().mockResolvedValue(basket),
    findByCustomerId: jest.fn().mockResolvedValue(basket),
    findBySessionId: jest.fn().mockResolvedValue(basket),
    findActiveBasket: jest.fn().mockResolvedValue(basket),
    save: jest.fn().mockResolvedValue(basket),
    delete: jest.fn().mockResolvedValue(undefined),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn().mockResolvedValue(undefined),
    getItems: jest.fn().mockResolvedValue([]),
    clearItems: jest.fn().mockResolvedValue(undefined),
    findAbandonedBaskets: jest.fn().mockResolvedValue([]),
    findExpiredBaskets: jest.fn().mockResolvedValue([]),
    markAsAbandoned: jest.fn().mockResolvedValue(undefined),
    mergeBaskets: jest.fn(),
  } as never as jest.Mocked<BasketRepository>;
}

describe('GetOrCreateBasketUseCase', () => {
  it('should return existing active basket for customer', async () => {
    const basket = createBasket();
    const repo = createMockBasketRepo(basket);
    const useCase = new GetOrCreateBasketUseCase(repo);

    const result = await useCase.execute(new GetOrCreateBasketCommand('cust-1'));

    expect(result.basketId).toBe('b-1');
    expect(result.customerId).toBe('cust-1');
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('should create a new basket when none exists', async () => {
    const repo = createMockBasketRepo(null);
    const useCase = new GetOrCreateBasketUseCase(repo);

    const result = await useCase.execute(new GetOrCreateBasketCommand('cust-2'));

    expect(result.basketId).toBe('basket-uuid-123');
    expect(result.customerId).toBe('cust-2');
    expect(repo.save).toHaveBeenCalled();
  });

  it('should create a new basket for session when none exists', async () => {
    const repo = createMockBasketRepo(null);
    const useCase = new GetOrCreateBasketUseCase(repo);

    const result = await useCase.execute(
      new GetOrCreateBasketCommand(undefined, 'sess-1', 'EUR'),
    );

    expect(result.basketId).toBe('basket-uuid-123');
    expect(result.sessionId).toBe('sess-1');
    expect(result.currency).toBe('EUR');
    expect(repo.save).toHaveBeenCalled();
  });
});
