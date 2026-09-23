import { createBasket, createBasketRepository, BASKET_ID } from '../../tests/testUtils';
import { ManageAdminBasketUseCase } from './ManageAdminBasket';

describe('ManageAdminBasketUseCase', () => {
  it('should return abandoned baskets older than the given number of days', async () => {
    const abandoned = createBasket();
    const repository = createBasketRepository();
    repository.findAbandonedBaskets.mockResolvedValue([abandoned]);

    const result = await new ManageAdminBasketUseCase(repository).findAbandonedBaskets(7);

    expect(result).toEqual([abandoned]);
    expect(repository.findAbandonedBaskets).toHaveBeenCalledWith(7);
  });

  it('should return expired baskets when asked', async () => {
    const expired = createBasket({ expiresAt: new Date(Date.now() - 1000) });
    const repository = createBasketRepository();
    repository.findExpiredBaskets.mockResolvedValue([expired]);

    const result = await new ManageAdminBasketUseCase(repository).findExpiredBaskets();

    expect(result).toEqual([expired]);
    expect(repository.findExpiredBaskets).toHaveBeenCalled();
  });

  it('should return the basket when looking it up by id', async () => {
    const basket = createBasket();
    const repository = createBasketRepository(basket);

    const result = await new ManageAdminBasketUseCase(repository).findById(BASKET_ID);

    expect(result).toBe(basket);
    expect(repository.findById).toHaveBeenCalledWith(BASKET_ID);
  });

  it('should delete the basket when an id is given', async () => {
    const repository = createBasketRepository();

    await new ManageAdminBasketUseCase(repository).delete(BASKET_ID);

    expect(repository.delete).toHaveBeenCalledWith(BASKET_ID);
  });
});
