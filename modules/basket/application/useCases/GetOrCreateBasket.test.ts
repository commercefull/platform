import { createBasket, createBasketRepository, emitMock, BASKET_ID } from '../../tests/testUtils';
import { GetOrCreateBasketCommand, GetOrCreateBasketUseCase } from './GetOrCreateBasket';
import { BasketValidationError } from '../../domain/errors/BasketErrors';
import type { StoreCurrencyPort } from '../ports/StoreCurrencyPort';

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

  it('should throw BasketValidationError when the store does not support the requested currency', async () => {
    const repository = createBasketRepository(null);
    const storeCurrencyPort: jest.Mocked<StoreCurrencyPort> = {
      isSupported: jest.fn().mockResolvedValue(false),
      getDefaultCode: jest.fn().mockResolvedValue('EUR'),
    };

    await expect(
      new GetOrCreateBasketUseCase(repository, storeCurrencyPort).execute(
        new GetOrCreateBasketCommand('customer-1', undefined, 'BTC', 'store-1'),
      ),
    ).rejects.toThrow(BasketValidationError);
    expect(repository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });

  it('should fall back to the store default currency when none is requested', async () => {
    const repository = createBasketRepository(null);
    const storeCurrencyPort: jest.Mocked<StoreCurrencyPort> = {
      isSupported: jest.fn().mockResolvedValue(true),
      getDefaultCode: jest.fn().mockResolvedValue('GBP'),
    };

    const result = await new GetOrCreateBasketUseCase(repository, storeCurrencyPort).execute(
      new GetOrCreateBasketCommand('customer-1', undefined, undefined, 'store-1'),
    );

    expect(storeCurrencyPort.getDefaultCode).toHaveBeenCalledWith('store-1');
    expect(storeCurrencyPort.isSupported).not.toHaveBeenCalled();
    expect(result.currency).toBe('GBP');
  });
});
