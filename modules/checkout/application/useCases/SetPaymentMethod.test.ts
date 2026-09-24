import { createCheckoutRepository, createCheckoutSession, emitMock } from '../../tests/testUtils';
import { SetPaymentMethodUseCase, SetPaymentMethodCommand } from './SetPaymentMethod';
import { NotFoundError, BadRequestError } from '../../../../libs/errors';

describe('SetPaymentMethodUseCase', () => {
  let useCase: SetPaymentMethodUseCase;
  let checkoutRepository: ReturnType<typeof createCheckoutRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutRepository = createCheckoutRepository();
    checkoutRepository.findById.mockResolvedValue(createCheckoutSession());
    checkoutRepository.getAvailablePaymentMethods.mockResolvedValue([
      { id: 'pm-card', name: 'Credit Card', type: 'credit_card', isDefault: true },
      { id: 'pm-paypal', name: 'PayPal', type: 'paypal', isDefault: false },
    ]);
    useCase = new SetPaymentMethodUseCase(checkoutRepository);
  });

  it('should set the payment method, persist the session, and emit checkout.updated when the method is available', async () => {
    const result = await useCase.execute(new SetPaymentMethodCommand('ck-1', 'pm-card'));

    expect(result.checkoutId).toBe('ck-1');
    expect(result.paymentMethodId).toBe('pm-card');
    expect(checkoutRepository.save).toHaveBeenCalled();
    expect(emitMock).toHaveBeenCalledWith('checkout.updated', expect.objectContaining({ checkoutId: 'ck-1', field: 'paymentMethod', methodId: 'pm-card' }));
  });

  it('should throw NotFoundError when the session does not exist', async () => {
    checkoutRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(new SetPaymentMethodCommand('missing', 'pm-card'))).rejects.toThrow(NotFoundError);
    expect(checkoutRepository.getAvailablePaymentMethods).not.toHaveBeenCalled();
  });

  it('should throw BadRequestError when the payment method is not available', async () => {
    await expect(useCase.execute(new SetPaymentMethodCommand('ck-1', 'unknown'))).rejects.toThrow(BadRequestError);
    expect(checkoutRepository.save).not.toHaveBeenCalled();
    expect(emitMock).not.toHaveBeenCalled();
  });
});
