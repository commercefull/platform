/**
 * Unit Tests for AddItem Use Case
 */

import { AddItemUseCase, AddItemCommand } from './AddItem';
import { Basket } from '../../domain/entities/Basket';
import { BasketItem } from '../../domain/entities/BasketItem';
import { Money } from '../../domain/valueObjects/Money';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';

import type { BasketRepository } from '../../domain/repositories/BasketRepository';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
}));

jest.mock('../../../../libs/uuid', () => ({
  generateUUID: jest.fn(() => 'item-uuid-123'),
}));

function createBasketWithItem(): Basket {
  const basket = Basket.create({ basketId: 'b-1', customerId: 'cust-1', currency: 'USD' });
  const item = BasketItem.create({
    basketItemId: 'item-1',
    basketId: 'b-1',
    productId: 'p-1',
    sku: 'SKU-1',
    name: 'Widget',
    quantity: 2,
    unitPrice: Money.create(50, 'USD'),
    itemType: 'physical',
    isGift: false,
  });
  basket.addItem(item);
  return basket;
}

function createMockBasketRepo(basket: Basket | null = null): jest.Mocked<BasketRepository> {
  return {
    findById: jest.fn().mockResolvedValue(basket),
    findByCustomerId: jest.fn().mockResolvedValue(basket),
    findBySessionId: jest.fn().mockResolvedValue(basket),
    findActiveBasket: jest.fn().mockResolvedValue(basket),
    save: jest.fn().mockResolvedValue(basket),
    delete: jest.fn().mockResolvedValue(undefined),
    addItem: jest.fn().mockResolvedValue({} as BasketItem),
    updateItem: jest.fn().mockResolvedValue({} as BasketItem),
    removeItem: jest.fn().mockResolvedValue(undefined),
    getItems: jest.fn().mockResolvedValue([]),
    clearItems: jest.fn().mockResolvedValue(undefined),
    findAbandonedBaskets: jest.fn().mockResolvedValue([]),
    findExpiredBaskets: jest.fn().mockResolvedValue([]),
    markAsAbandoned: jest.fn().mockResolvedValue(undefined),
    mergeBaskets: jest.fn(),
  } as never as jest.Mocked<BasketRepository>;
}

describe('AddItemUseCase', () => {
  it('should add a new item to basket', async () => {
    const basket = createBasketWithItem();
    const repo = createMockBasketRepo(basket);
    const useCase = new AddItemUseCase(repo);

    const result = await useCase.execute(
      new AddItemCommand('b-1', 'p-2', 'SKU-2', 'Gadget', 1, 30),
    );

    expect(result.basketId).toBe('b-1');
    expect(repo.addItem).toHaveBeenCalled();
  });

  it('should increment quantity when product already exists', async () => {
    const basket = createBasketWithItem();
    const repo = createMockBasketRepo(basket);
    const useCase = new AddItemUseCase(repo);

    await useCase.execute(
      new AddItemCommand('b-1', 'p-1', 'SKU-1', 'Widget', 3, 50),
    );

    expect(repo.updateItem).toHaveBeenCalled();
    expect(repo.addItem).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    const repo = createMockBasketRepo(null);
    const useCase = new AddItemUseCase(repo);

    await expect(
      useCase.execute(new AddItemCommand('nonexistent', 'p-1', 'SKU-1', 'Widget', 1, 50)),
    ).rejects.toThrow(BasketNotFoundError);
  });
});
