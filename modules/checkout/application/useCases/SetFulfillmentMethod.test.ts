import { createCheckoutRepository, createCheckoutSession, emitMock } from '../../tests/testUtils';
import { SetFulfillmentMethodUseCase, SetFulfillmentMethodCommand } from './SetFulfillmentMethod';
import { CheckoutSessionNotFoundError, CheckoutValidationError } from '../../domain/errors/CheckoutErrors';
import type { FulfillmentType } from '../../domain/entities/CheckoutSession';

describe('SetFulfillmentMethodUseCase', () => {
  let useCase: SetFulfillmentMethodUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    useCase = new SetFulfillmentMethodUseCase(checkoutRepository);
  });

  it('should set the fulfillment type, persist the session, and emit checkout.updated when the type is valid', async () => {
    const result = await useCase.execute(new SetFulfillmentMethodCommand('ck-1', 'pickup'));

    expect(result.fulfillmentType).toBe('pickup');
    expect(checkoutRepository.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', field: 'fulfillmentType', fulfillmentType: 'pickup' }));
  });

  it('should clear the shipping method when switching to pickup', async () => {
    checkoutRepository.findById.mockResolvedValue(
      createCheckoutSession({ shippingMethodId: 'sm-1', shippingMethodName: 'Standard' }),
    );

    const result = await useCase.execute(new SetFulfillmentMethodCommand('ck-1', 'pickup'));

    expect(result.shippingMethodId).toBeUndefined();
    expect(result.shippingAmountCents).toBe(0);
  });

  it('should throw CheckoutSessionNotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetFulfillmentMethodCommand('missing', 'pickup'))).rejects.toThrow(CheckoutSessionNotFoundError);
  });

  it('should throw CheckoutValidationError when the fulfillment type is invalid', async () => {
    await expect(
      useCase.execute(new SetFulfillmentMethodCommand('ck-1', 'teleport' as unknown as FulfillmentType)),
    ).rejects.toThrow(CheckoutValidationError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
  });
});
