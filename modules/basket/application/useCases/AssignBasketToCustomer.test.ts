import { createBasket, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { AssignBasketToCustomerCommand, AssignBasketToCustomerUseCase } from './AssignBasketToCustomer';
import { BasketNotFoundError, BasketAlreadyAssignedError } from '../../domain/errors/BasketErrors';

describe('AssignBasketToCustomerUseCase', () => {
  it('should assign the basket to the customer when the basket is a guest basket', async () => {
    const basket = createBasket({ sessionId: 'session-1' });
    const repository = createBasketRepository(basket);

    const result = await new AssignBasketToCustomerUseCase(repository).execute(
      new AssignBasketToCustomerCommand(BASKET_ID, 'customer-1'),
    );

    expect(result.customerId).toBe('customer-1');
    expect(result.sessionId).toBeUndefined();
    expect(repository.save).toHaveBeenCalledWith(basket);
  });

  it('should emit basket.assigned_to_customer with the previous session when the basket is assigned', async () => {
    const repository = createBasketRepository(createBasket({ sessionId: 'session-1' }));

    await new AssignBasketToCustomerUseCase(repository).execute(new AssignBasketToCustomerCommand(BASKET_ID, 'customer-1'));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.assigned_to_customer',
      expect.objectContaining({ basketId: BASKET_ID, customerId: 'customer-1', previousSessionId: 'session-1' }),
    );
  });

  it('should keep the same customer when the basket is already assigned to them', async () => {
    const repository = createBasketRepository(createBasket({ customerId: 'customer-1' }));

    const result = await new AssignBasketToCustomerUseCase(repository).execute(
      new AssignBasketToCustomerCommand(BASKET_ID, 'customer-1'),
    );

    expect(result.customerId).toBe('customer-1');
  });

  it('should throw BasketAlreadyAssignedError when the basket belongs to a different customer', async () => {
    const repository = createBasketRepository(createBasket({ customerId: 'other-customer' }));

    await expect(
      new AssignBasketToCustomerUseCase(repository).execute(new AssignBasketToCustomerCommand(BASKET_ID, 'customer-1')),
    ).rejects.toThrow(BasketAlreadyAssignedError);
  });

  it('should throw BasketNotFoundError when the basket does not exist', async () => {
    const repository = createBasketRepository(null);

    await expect(
      new AssignBasketToCustomerUseCase(repository).execute(new AssignBasketToCustomerCommand('missing', 'customer-1')),
    ).rejects.toThrow(BasketNotFoundError);
  });

  it('should throw BasketNotFoundError when the basket is removed during the operation', async () => {
    const repository = createBasketRepository();
    repository.findById.mockResolvedValueOnce(createBasket({ sessionId: 'session-1' })).mockResolvedValue(null);

    await expect(
      new AssignBasketToCustomerUseCase(repository).execute(new AssignBasketToCustomerCommand(BASKET_ID, 'customer-1')),
    ).rejects.toThrow(BasketNotFoundError);
  });
});
