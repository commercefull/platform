import { createBasket, createBasketItem, createBasketRepository, emitMock, BASKET_ID, ITEM_ID } from '../../tests/testUtils';
import { RemoveItemCommand, RemoveItemUseCase } from './RemoveItem';
import { BasketNotFoundError, BasketItemNotFoundError } from '../../domain/errors/BasketErrors';

describe('RemoveItemUseCase', () => {
  it('should remove the item from the basket when it exists', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    const result = await new RemoveItemUseCase(repository).execute(new RemoveItemCommand(BASKET_ID, ITEM_ID));

    expect(repository.removeItem).toHaveBeenCalledWith(ITEM_ID);
    expect(result.basketId).toBe(BASKET_ID);
  });

  it('should emit basket.item_removed with the product id when the item is removed', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    await new RemoveItemUseCase(repository).execute(new RemoveItemCommand(BASKET_ID, ITEM_ID));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.item_removed',
      expect.objectContaining({ basketId: BASKET_ID, basketItemId: ITEM_ID, productId: 'product-1' }),
    );
  });

  it('should throw BasketItemNotFoundError when the item does not exist', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    await expect(new RemoveItemUseCase(repository).execute(new RemoveItemCommand(BASKET_ID, 'missing'))).rejects.toThrow(
      BasketItemNotFoundError,
    );
    expect(repository.removeItem).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(new RemoveItemUseCase(repository).execute(new RemoveItemCommand('missing', ITEM_ID))).rejects.toThrow(
      BasketNotFoundError,
    );
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById.mockResolvedValueOnce(createBasket({ items: [createBasketItem()] })).mockResolvedValue(null);

    await expect(new RemoveItemUseCase(repository).execute(new RemoveItemCommand(BASKET_ID, ITEM_ID))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
