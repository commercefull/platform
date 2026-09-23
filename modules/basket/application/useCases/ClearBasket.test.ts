import { createBasket, createBasketItem, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { ClearBasketCommand, ClearBasketUseCase } from './ClearBasket';
import { BasketNotFoundError } from '../../domain/errors/BasketErrors';

describe('ClearBasketUseCase', () => {
  it('should remove all items when the basket is cleared', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    const result = await new ClearBasketUseCase(repository).execute(new ClearBasketCommand(BASKET_ID));

    expect(result.items).toHaveLength(0);
    expect(result.itemCount).toBe(0);
    expect(repository.clearItems).toHaveBeenCalledWith(BASKET_ID);
  });

  it('should emit basket.cleared with the number of removed items when the basket is cleared', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    await new ClearBasketUseCase(repository).execute(new ClearBasketCommand(BASKET_ID));

    expect(emitMock).toHaveBeenCalledWith('basket.cleared', expect.objectContaining({ basketId: BASKET_ID, itemCount: 2 }));
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(new ClearBasketUseCase(repository).execute(new ClearBasketCommand('missing'))).rejects.toThrow(
      BasketNotFoundError,
    );
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById
      .mockResolvedValueOnce(createBasket({ items: [createBasketItem()] }))
      .mockResolvedValue(null);

    await expect(new ClearBasketUseCase(repository).execute(new ClearBasketCommand(BASKET_ID))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
