import { SavePaymentMethodUseCase} from './SavePaymentMethod';
import { CustomerIdAndProviderMethodIdRequiredError, PaymentMethodAlreadySavedError } from '../../domain/errors/PaymentErrors';

describe('SavePaymentMethodUseCase', () => {
  let useCase: SavePaymentMethodUseCase;
  let mockRepo: Record<string, jest.Mock>;

  beforeEach(() => {
    mockRepo = {
      findPaymentMethodByProviderId: jest.fn().mockResolvedValue(null),
      unsetDefaultPaymentMethods: jest.fn().mockResolvedValue(undefined),
      createPaymentMethod: jest.fn().mockResolvedValue({
        paymentMethodId: 'pm_1', type: 'card', provider: 'stripe', last4: '4242', brand: 'visa',
        isDefault: true, createdAt: new Date(),
      }),
    };
    useCase = new SavePaymentMethodUseCase(mockRepo as never);
  });

  it('should save payment method (happy path)', async () => {
    const result = await useCase.execute({
      customerId: 'c1', type: 'card', provider: 'stripe', providerPaymentMethodId: 'pm_stripe_1', isDefault: true,
    });

    expect(result.paymentMethodId).toBe('pm_1');
    expect(result.isDefault).toBe(true);
    expect(mockRepo.unsetDefaultPaymentMethods).toHaveBeenCalledWith('c1');
  });

  it('should throw error when customerId is missing', async () => {
    await expect(useCase.execute({
      customerId: '', type: 'card', provider: 'stripe', providerPaymentMethodId: 'pm_1',
    })).rejects.toThrow(CustomerIdAndProviderMethodIdRequiredError);
  });

  it('should throw error when providerPaymentMethodId is missing', async () => {
    await expect(useCase.execute({
      customerId: 'c1', type: 'card', provider: 'stripe', providerPaymentMethodId: '',
    })).rejects.toThrow(CustomerIdAndProviderMethodIdRequiredError);
  });

  it('should throw error when payment method already saved', async () => {
    mockRepo.findPaymentMethodByProviderId.mockResolvedValue({ paymentMethodId: 'existing' });

    await expect(useCase.execute({
      customerId: 'c1', type: 'card', provider: 'stripe', providerPaymentMethodId: 'pm_1',
    })).rejects.toThrow(PaymentMethodAlreadySavedError);
  });
});
