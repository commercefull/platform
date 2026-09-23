import { createBasket, createBasketItem, createBasketRepository, emitMock, BASKET_ID, ITEM_ID } from '../../tests/testUtils';
import { UpdateItemQuantityCommand, UpdateItemQuantityUseCase } from './UpdateItemQuantity';
import { BasketNotFoundError, BasketItemNotFoundError, BasketItemQuantityError } from '../../domain/errors/BasketErrors';

describe('UpdateItemQuantityUseCase', () => {
  it('should update the quantity when the new quantity is positive', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    const result = await new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand(BASKET_ID, ITEM_ID, 5));

    expect(repository.updateItem.mock.calls[0][0].quantity).toBe(5);
    expect(repository.removeItem).not.toHaveBeenCalled();
    expect(result.itemCount).toBe(5);
  });

  it('should emit basket.item_updated when the quantity changes', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    await new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand(BASKET_ID, ITEM_ID, 5));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.item_updated',
      expect.objectContaining({ basketId: BASKET_ID, basketItemId: ITEM_ID, quantity: 5 }),
    );
  });

  it.each([0, -3])('should remove the item when the quantity is %i', async quantity => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    await new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand(BASKET_ID, ITEM_ID, quantity));

    expect(repository.removeItem).toHaveBeenCalledWith(ITEM_ID);
    expect(repository.updateItem).not.toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith(
      'basket.item_removed',
      expect.objectContaining({ basketId: BASKET_ID, basketItemId: ITEM_ID }),
    );
  });

  it('should throw BasketItemQuantityError when the quantity exceeds the maximum', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    await expect(
      new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand(BASKET_ID, ITEM_ID, 101)),
    ).rejects.toThrow(BasketItemQuantityError);
    expect(repository.updateItem).not.toHaveBeenCalled();
  });

  it('should throw BasketItemNotFoundError when the item does not exist', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    await expect(
      new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand(BASKET_ID, 'missing', 5)),
    ).rejects.toThrow(BasketItemNotFoundError);
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(
      new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand('missing', ITEM_ID, 5)),
    ).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById
      .mockResolvedValueOnce(createBasket({ items: [createBasketItem({ quantity: 2 })] }))
      .mockResolvedValue(null);

    await expect(
      new UpdateItemQuantityUseCase(repository).execute(new UpdateItemQuantityCommand(BASKET_ID, ITEM_ID, 5)),
    ).rejects.toThrow(BasketNotFoundError);
  });
});
