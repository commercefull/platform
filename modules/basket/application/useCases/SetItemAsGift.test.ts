import { createBasket, createBasketItem, createBasketRepository, emitMock, BASKET_ID, ITEM_ID } from '../../tests/testUtils';
import { SetItemAsGiftCommand, SetItemAsGiftUseCase } from './SetItemAsGift';
import { BasketNotFoundError, BasketItemNotFoundError } from '../../domain/errors/BasketErrors';

describe('SetItemAsGiftUseCase', () => {
  it('should mark the item as a gift when it exists', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    const result = await new SetItemAsGiftUseCase(repository).execute(
      new SetItemAsGiftCommand(BASKET_ID, ITEM_ID, 'Happy Birthday!'),
    );

    const updatedItem = repository.updateItem.mock.calls[0][0];
    expect(updatedItem.isGift).toBe(true);
    expect(updatedItem.giftMessage).toBe('Happy Birthday!');
    expect(result.items[0].isGift).toBe(true);
  });

  it('should emit basket.item_set_as_gift when the item is marked as a gift', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    await new SetItemAsGiftUseCase(repository).execute(new SetItemAsGiftCommand(BASKET_ID, ITEM_ID, 'Happy Birthday!'));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.item_set_as_gift',
      expect.objectContaining({ basketId: BASKET_ID, basketItemId: ITEM_ID, giftMessage: 'Happy Birthday!' }),
    );
  });

  it('should throw BasketItemNotFoundError when the item does not exist', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem()] }));

    await expect(new SetItemAsGiftUseCase(repository).execute(new SetItemAsGiftCommand(BASKET_ID, 'missing'))).rejects.toThrow(
      BasketItemNotFoundError,
    );
    expect(repository.updateItem).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(new SetItemAsGiftUseCase(repository).execute(new SetItemAsGiftCommand('missing', ITEM_ID))).rejects.toThrow(
      BasketNotFoundError,
    );
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById.mockResolvedValueOnce(createBasket({ items: [createBasketItem()] })).mockResolvedValue(null);

    await expect(new SetItemAsGiftUseCase(repository).execute(new SetItemAsGiftCommand(BASKET_ID, ITEM_ID))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
