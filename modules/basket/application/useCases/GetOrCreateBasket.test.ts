import { createBasket, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { GetOrCreateBasketCommand, GetOrCreateBasketUseCase } from './GetOrCreateBasket';

describe('GetOrCreateBasketUseCase', () => {
  it('should return the existing basket when the customer already has an active basket', async () => {
    const repository = createBasketRepository(createBasket({ customerId: 'customer-1' }));

    const result = await new GetOrCreateBasketUseCase(repository).execute(new GetOrCreateBasketCommand('customer-1'));

    expect(result.basketId).toBe(BASKET_ID);
    expect(result.customerId).toBe('customer-1');
    expect(result).toHaveProperty('isNew', false);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('should create and save a new basket when the customer has none', async () => {
    const repository = createBasketRepository(null);

    const result = await new GetOrCreateBasketUseCase(repository).execute(new GetOrCreateBasketCommand('customer-2'));

    expect(result.basketId).toBe('test-uuid');
    expect(result.customerId).toBe('customer-2');
    expect(result).toHaveProperty('isNew', true);
    expect(repository.save).toHaveBeenCalled();
  });

  it('should emit basket.created when a new basket is created', async () => {
    const repository = createBasketRepository(null);

    await new GetOrCreateBasketUseCase(repository).execute(new GetOrCreateBasketCommand('customer-2'));

    expect(emitMock).toHaveBeenCalledWith(
      'basket.created',
      expect.objectContaining({ basketId: 'test-uuid', customerId: 'customer-2' }),
    );
  });

  it('should not emit basket.created when an existing basket is returned', async () => {
    const repository = createBasketRepository(createBasket({ customerId: 'customer-1' }));

    await new GetOrCreateBasketUseCase(repository).execute(new GetOrCreateBasketCommand('customer-1'));

    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should create a session basket with the requested currency when only a session is provided', async () => {
    const repository = createBasketRepository(null);

    const result = await new GetOrCreateBasketUseCase(repository).execute(
      new GetOrCreateBasketCommand(undefined, 'session-1', 'EUR'),
    );

    expect(repository.findActiveBasket).toHaveBeenCalledWith(undefined, 'session-1');
    expect(result.sessionId).toBe('session-1');
    expect(result.currency).toBe('EUR');
  });
});
