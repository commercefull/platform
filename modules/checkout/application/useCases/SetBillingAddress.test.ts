import { createCheckoutRepository, createCheckoutSession, emitMock } from '../../tests/testUtils';
import { SetBillingAddressUseCase, SetBillingAddressCommand } from './SetBillingAddress';
import { CheckoutSessionNotFoundError } from '../../domain/errors/CheckoutErrors';

const command = (sameAsShipping = false) =>
  new SetBillingAddressCommand('ck-1', 'Jane', 'Doe', '123 Main St', 'Portland', '97201', 'US', undefined, undefined, 'OR', undefined, sameAsShipping);

describe('SetBillingAddressUseCase', () => {
  let useCase: SetBillingAddressUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    useCase = new SetBillingAddressUseCase(checkoutRepository);
  });

  it('should set the billing address, persist the session, and emit checkout.updated when the session exists', async () => {
    const result = await useCase.execute(command());

    expect(result.checkoutId).toBe('ck-1');
    expect(result.billingAddress?.city).toBe('Portland');
    expect(result.sameAsShipping).toBe(false);
    expect(checkoutRepository.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', field: 'billingAddress', country: 'US' }));
  });

  it('should flag sameAsShipping without overwriting the billing address when requested', async () => {
    const session = createCheckoutSession();
    checkoutRepository.findById.mockResolvedValue(session);

    const result = await useCase.execute(command(true));

    expect(result.sameAsShipping).toBe(true);
    expect(result.billingAddress).toBeUndefined();
  });

  it('should throw CheckoutSessionNotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(command())).rejects.toThrow(CheckoutSessionNotFoundError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
