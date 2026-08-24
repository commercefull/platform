jest.mock('../../infrastructure/repositories/PaymentDataRepository', () => ({
  __esModule: true,
  default: {
    payments: {
      createStoredMethod: jest.fn().mockResolvedValue({
        storedPaymentMethodId: 'spm1', customerId: 'c1', organizationId: 'org1', type: 'card',
        provider: 'stripe', last4: '4242', brand: 'visa', isDefault: true, createdAt: new Date(),
      }),
      setDefaultStoredMethod: jest.fn().mockResolvedValue(undefined),
      findStoredMethodById: jest.fn().mockResolvedValue({
        storedPaymentMethodId: 'spm1', customerId: 'c1', organizationId: 'org1', type: 'card',
        provider: 'stripe', last4: '4242', brand: 'visa', isDefault: true, createdAt: new Date(),
      }),
    },
    gateways: {},
  },
}));

import { SaveStoredPaymentMethodUseCase, SaveStoredPaymentMethodCommand } from './SaveStoredPaymentMethod';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';
import { FailedToCreateStoredPaymentMethodError } from '../../domain/errors/PaymentErrors';

const mockRepo = paymentDataRepository as unknown as { payments: Record<string, jest.Mock> };

describe('SaveStoredPaymentMethodUseCase', () => {
  let useCase: SaveStoredPaymentMethodUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new SaveStoredPaymentMethodUseCase();
  });

  it('should save stored payment method (happy path)', async () => {
    const result = await useCase.execute(new SaveStoredPaymentMethodCommand(
      'c1', 'org1', 'card', 'stripe', 'tok_1', true, '4242', 'visa', 12, 2026,
    ));

    expect(result.storedPaymentMethodId).toBe('spm1');
    expect(result.isDefault).toBe(true);
    expect(mockRepo.payments.setDefaultStoredMethod).toHaveBeenCalledWith('spm1', 'c1');
  });

  it('should throw FailedToCreateStoredPaymentMethodError when creation fails', async () => {
    mockRepo.payments.createStoredMethod.mockResolvedValueOnce(null);

    await expect(useCase.execute(new SaveStoredPaymentMethodCommand(
      'c1', 'org1', 'card', 'stripe', 'tok_1',
    ))).rejects.toThrow(FailedToCreateStoredPaymentMethodError);
  });

  it('should not set default when isDefault is false', async () => {
    mockRepo.payments.createStoredMethod.mockResolvedValueOnce({
      storedPaymentMethodId: 'spm2', customerId: 'c1', organizationId: 'org1', type: 'card',
      provider: 'stripe', isDefault: false, createdAt: new Date(),
    });

    await useCase.execute(new SaveStoredPaymentMethodCommand(
      'c1', 'org1', 'card', 'stripe', 'tok_2', false,
    ));

    expect(mockRepo.payments.setDefaultStoredMethod).not.toHaveBeenCalled();
  });
});
