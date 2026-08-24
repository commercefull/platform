/**
 * Unit Tests for UpdateItemQuantity Use Case
 */

import { UpdateItemQuantityUseCase, UpdateItemQuantityCommand } from './UpdateItemQuantity';
import { Basket } from '../../domain/entities/Basket';
import { BasketItem } from '../../domain/entities/BasketItem';
import { Money } from '../../domain/valueObjects/Money';
import { BasketNotFoundError, BasketItemNotFoundError } from '../../domain/errors/BasketErrors';

import type { BasketRepository } from '../../domain/repositories/BasketRepository';

jest.mock('../../../../libs/events/eventBus', () => ({
  eventBus: { emit: jest.fn() },
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
    addItem: jest.fn(),
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

describe('UpdateItemQuantityUseCase', () => {
  it('should update item quantity to a positive value', async () => {
    const basket = createBasketWithItem();
    const repo = createMockBasketRepo(basket);
    const useCase = new UpdateItemQuantityUseCase(repo);

    const result = await useCase.execute(
      new UpdateItemQuantityCommand('b-1', 'item-1', 5),
    );

    expect(result.basketId).toBe('b-1');
    expect(repo.updateItem).toHaveBeenCalled();
  });

  it('should remove item when quantity is zero or negative', async () => {
    const basket = createBasketWithItem();
    const repo = createMockBasketRepo(basket);
    const useCase = new UpdateItemQuantityUseCase(repo);

    await useCase.execute(
      new UpdateItemQuantityCommand('b-1', 'item-1', 0),
    );

    expect(repo.removeItem).toHaveBeenCalledWith('item-1');
    expect(repo.updateItem).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when basket does not exist', async () => {
    const repo = createMockBasketRepo(null);
    const useCase = new UpdateItemQuantityUseCase(repo);

    await expect(
      useCase.execute(new UpdateItemQuantityCommand('nonexistent', 'item-1', 5)),
    ).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketItemNotFoundError when item does not exist', async () => {
    const basket = createBasketWithItem();
    const repo = createMockBasketRepo(basket);
    const useCase = new UpdateItemQuantityUseCase(repo);

    await expect(
      useCase.execute(new UpdateItemQuantityCommand('b-1', 'nonexistent-item', 5)),
    ).rejects.toThrow(BasketItemNotFoundError);
  });
});
