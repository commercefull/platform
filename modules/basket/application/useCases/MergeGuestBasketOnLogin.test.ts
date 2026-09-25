/**
 * Tests for MergeGuestBasketOnLoginUseCase.
 *
 * On login the anonymous session basket is either adopted (no existing
 * customer basket) or merged into the customer's basket. A session basket
 * owned by a different customer is never touched.
 */

import { createBasket, createBasketRepository } from '../../tests/testUtils';
import { MergeGuestBasketOnLoginUseCase, MergeGuestBasketOnLoginCommand } from './MergeGuestBasketOnLogin';
import { MergeBasketsUseCase } from './MergeBaskets';
import { AssignBasketToCustomerUseCase } from './AssignBasketToCustomer';
import { Basket } from '../../domain/entities/Basket';

const CUSTOMER_ID = 'cust-1';
const SESSION_ID = 'sess-1';

function buildUseCase(repository: ReturnType<typeof createBasketRepository>) {
  return new MergeGuestBasketOnLoginUseCase(
    repository,
    new MergeBasketsUseCase(repository),
    new AssignBasketToCustomerUseCase(repository),
  );
}

describe('MergeGuestBasketOnLoginUseCase', () => {
  it('should adopt the session basket when the customer has no basket', async () => {
    const sessionBasket = createBasket({ basketId: 'basket-session', sessionId: SESSION_ID });
    const repository = createBasketRepository(null);
    repository.findBySessionId.mockResolvedValue(sessionBasket);
    repository.findByCustomerId.mockResolvedValue(null);
    repository.findById.mockResolvedValue(sessionBasket);

    const result = await buildUseCase(repository).execute(new MergeGuestBasketOnLoginCommand(CUSTOMER_ID, SESSION_ID));

    expect(sessionBasket.customerId).toBe(CUSTOMER_ID);
    expect(repository.save).toHaveBeenCalledWith(sessionBasket);
    expect(repository.mergeBaskets).not.toHaveBeenCalled();
    expect(result?.basketId).toBe('basket-session');
  });

  it('should merge the session basket into the existing customer basket', async () => {
    const sessionBasket = createBasket({ basketId: 'basket-session', sessionId: SESSION_ID });
    const customerBasket = createBasket({ basketId: 'basket-customer', customerId: CUSTOMER_ID });
    const repository = createBasketRepository(null);
    repository.findBySessionId.mockResolvedValue(sessionBasket);
    repository.findByCustomerId.mockResolvedValue(customerBasket);
    repository.findById.mockImplementation(async (id: string) =>
      id === 'basket-session' ? sessionBasket : customerBasket,
    );
    repository.mergeBaskets.mockResolvedValue(customerBasket);

    const result = await buildUseCase(repository).execute(new MergeGuestBasketOnLoginCommand(CUSTOMER_ID, SESSION_ID));

    expect(repository.mergeBaskets).toHaveBeenCalledWith('basket-session', 'basket-customer');
    expect(result?.basketId).toBe('basket-customer');
  });

  it('should return null when no session basket exists', async () => {
    const repository = createBasketRepository(null);

    const result = await buildUseCase(repository).execute(new MergeGuestBasketOnLoginCommand(CUSTOMER_ID, SESSION_ID));

    expect(result).toBeNull();
    expect(repository.findByCustomerId).not.toHaveBeenCalled();
  });

  it('should return null when there is no sessionId', async () => {
    const repository = createBasketRepository(null);

    const result = await buildUseCase(repository).execute(new MergeGuestBasketOnLoginCommand(CUSTOMER_ID));

    expect(result).toBeNull();
    expect(repository.findBySessionId).not.toHaveBeenCalled();
  });

  it('should do nothing when the session basket already belongs to the customer', async () => {
    const sessionBasket = createBasket({ basketId: 'basket-1', sessionId: SESSION_ID, customerId: CUSTOMER_ID });
    const repository = createBasketRepository(null);
    repository.findBySessionId.mockResolvedValue(sessionBasket);

    const result = await buildUseCase(repository).execute(new MergeGuestBasketOnLoginCommand(CUSTOMER_ID, SESSION_ID));

    expect(result).toBeNull();
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.mergeBaskets).not.toHaveBeenCalled();
  });

  it('should not merge a session basket owned by a different customer', async () => {
    const foreignBasket: Basket = createBasket({
      basketId: 'basket-foreign',
      sessionId: SESSION_ID,
      customerId: 'cust-other',
    });
    const repository = createBasketRepository(null);
    repository.findBySessionId.mockResolvedValue(foreignBasket);

    const result = await buildUseCase(repository).execute(new MergeGuestBasketOnLoginCommand(CUSTOMER_ID, SESSION_ID));

    expect(result).toBeNull();
    expect(repository.findByCustomerId).not.toHaveBeenCalled();
    expect(repository.save).not.toHaveBeenCalled();
    expect(repository.mergeBaskets).not.toHaveBeenCalled();
  });
});
