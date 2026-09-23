import { createBasket, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { ExtendExpirationCommand, ExtendExpirationUseCase } from './ExtendExpiration';
import { BasketNotFoundError, InvalidExpirationDaysError } from '../../domain/errors/BasketErrors';

describe('ExtendExpirationUseCase', () => {
  it('should extend the expiration when the number of days is positive', async () => {
    const basket = createBasket();
    const previousExpiry = basket.expiresAt?.getTime() ?? 0;
    const repository = createBasketRepository(basket);

    await new ExtendExpirationUseCase(repository).execute(new ExtendExpirationCommand(BASKET_ID, 30));

    expect(repository.save).toHaveBeenCalledWith(basket);
    expect(basket.expiresAt?.getTime() ?? 0).toBeGreaterThan(previousExpiry);
  });

  it('should emit basket.expiration_extended when the expiration is extended', async () => {
    const repository = createBasketRepository(createBasket());

    await new ExtendExpirationUseCase(repository).execute(new ExtendExpirationCommand(BASKET_ID, 7));

    expect(emitMock).toHaveBeenCalledWith('basket.expiration_extended', expect.objectContaining({ basketId: BASKET_ID, days: 7 }));
  });

  it('should throw InvalidExpirationDaysError when days is less than 1', async () => {
    const repository = createBasketRepository(createBasket());

    await expect(new ExtendExpirationUseCase(repository).execute(new ExtendExpirationCommand(BASKET_ID, 0))).rejects.toThrow(
      InvalidExpirationDaysError,
    );
    expect(repository.findById).not.toHaveBeenCalled();
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(new ExtendExpirationUseCase(repository).execute(new ExtendExpirationCommand('missing', 7))).rejects.toThrow(
      BasketNotFoundError,
    );
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById.mockResolvedValueOnce(createBasket()).mockResolvedValue(null);

    await expect(new ExtendExpirationUseCase(repository).execute(new ExtendExpirationCommand(BASKET_ID, 7))).rejects.toThrow(
      BasketNotFoundError,
    );
  });
});
