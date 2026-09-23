import { createBasket, createBasketItem, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { AddItemCommand, AddItemUseCase } from './AddItem';
import { BasketNotFoundError, BasketValidationError } from '../../domain/errors/BasketErrors';

describe('AddItemUseCase', () => {
  it('should add a new item to the basket when the product is not already in it', async () => {
    const repository = createBasketRepository(createBasket());

    const result = await new AddItemUseCase(repository).execute(
      new AddItemCommand(BASKET_ID, 'product-2', 'SKU-2', 'Gadget', 1, 30),
    );

    const addedItem = repository.addItem.mock.calls[0][1];
    expect(addedItem.basketItemId).toBe('test-uuid');
    expect(addedItem.productId).toBe('product-2');
    expect(result.basketId).toBe(BASKET_ID);
    expect(result.itemCount).toBe(1);
  });

  it('should increase the quantity when the product is already in the basket', async () => {
    const repository = createBasketRepository(createBasket({ items: [createBasketItem({ quantity: 2 })] }));

    const result = await new AddItemUseCase(repository).execute(
      new AddItemCommand(BASKET_ID, 'product-1', 'SKU-1', 'Widget', 3, 50),
    );

    expect(repository.updateItem).toHaveBeenCalled();
    expect(repository.addItem).not.toHaveBeenCalled();
    expect(repository.updateItem.mock.calls[0][0].quantity).toBe(5);
    expect(result.itemCount).toBe(5);
  });

  it('should add a separate item when the same product has a different variant', async () => {
    const repository = createBasketRepository(
      createBasket({ items: [createBasketItem({ productVariantId: 'variant-1' })] }),
    );

    await new AddItemUseCase(repository).execute(
      new AddItemCommand(BASKET_ID, 'product-1', 'SKU-1', 'Widget', 1, 50, 'variant-2'),
    );

    expect(repository.addItem).toHaveBeenCalled();
    expect(repository.updateItem).not.toHaveBeenCalled();
  });

  it('should emit basket.item_added when an item is added', async () => {
    const repository = createBasketRepository(createBasket());

    await new AddItemUseCase(repository).execute(new AddItemCommand(BASKET_ID, 'product-2', 'SKU-2', 'Gadget', 1, 30));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.item_added',
      expect.objectContaining({ basketId: BASKET_ID, productId: 'product-2', quantity: 1 }),
    );
  });

  it('should throw BasketValidationError when the quantity is less than 1', async () => {
    const repository = createBasketRepository(createBasket());

    await expect(
      new AddItemUseCase(repository).execute(new AddItemCommand(BASKET_ID, 'product-2', 'SKU-2', 'Gadget', 0, 30)),
    ).rejects.toThrow(BasketValidationError);
    expect(repository.findById).not.toHaveBeenCalled();
    expect(repository.addItem).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(
      new AddItemUseCase(repository).execute(new AddItemCommand('missing', 'product-1', 'SKU-1', 'Widget', 1, 50)),
    ).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById.mockResolvedValueOnce(createBasket()).mockResolvedValue(null);

    await expect(
      new AddItemUseCase(repository).execute(new AddItemCommand(BASKET_ID, 'product-2', 'SKU-2', 'Gadget', 1, 30)),
    ).rejects.toThrow(BasketNotFoundError);
  });
});
