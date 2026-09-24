import { GetPaymentMethodsUseCase } from './GetPaymentMethods';

type PaymentRepoPort = ConstructorParameters<typeof GetPaymentMethodsUseCase>[0];
type ConfigRepoPort = ConstructorParameters<typeof GetPaymentMethodsUseCase>[1];

describe('GetPaymentMethodsUseCase', () => {
  let useCase: GetPaymentMethodsUseCase;
  let mockPaymentRepo: jest.Mocked<Pick<PaymentRepoPort, 'findSavedPaymentMethods'>>;
  let mockConfigRepo: jest.Mocked<Pick<ConfigRepoPort, 'findActiveConfigs'>>;

  beforeEach(() => {
    mockPaymentRepo = {
      findSavedPaymentMethods: jest
        .fn()
        .mockResolvedValue([
          { paymentMethodId: 'pm1', type: 'card', provider: 'stripe', name: 'Visa', isDefault: true, last4: '4242', brand: 'visa' },
        ]),
    };
    mockConfigRepo = {
      findActiveConfigs: jest.fn().mockResolvedValue([
        { paymentMethodConfigId: 'cfg1', type: 'card', provider: 'stripe', displayName: 'Credit Card', isActive: true },
        { paymentMethodConfigId: 'cfg2', type: 'wallet', provider: 'paypal', displayName: 'PayPal', isActive: true },
      ]),
    };
    useCase = new GetPaymentMethodsUseCase(mockPaymentRepo, mockConfigRepo);
  });

  it('should get payment methods (happy path)', async () => {
    const result = await useCase.execute({ customerId: 'c1' });

    expect(result.savedMethods).toHaveLength(1);
    expect(result.availableMethods).toHaveLength(2);
  });

  it('should return empty saved methods when no customerId', async () => {
    const result = await useCase.execute({});

    expect(result.savedMethods).toHaveLength(0);
    expect(result.availableMethods).toHaveLength(2);
  });
});
