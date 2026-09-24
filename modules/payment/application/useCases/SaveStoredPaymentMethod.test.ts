import { lazyMock, createStoredPaymentMethod } from '../../tests/testUtils';
import { SaveStoredPaymentMethodUseCase, SaveStoredPaymentMethodCommand } from './SaveStoredPaymentMethod';
import { FailedToCreateStoredPaymentMethodError, FailedToRetrieveSavedPaymentMethodError } from '../../domain/errors/PaymentErrors';
import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';

describe('SaveStoredPaymentMethodUseCase', () => {
  let useCase: SaveStoredPaymentMethodUseCase;
  let repo: jest.Mocked<PaymentRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentRepository>();
    repo.createStoredMethod.mockResolvedValue(createStoredPaymentMethod({ storedPaymentMethodId: 'spm1', isDefault: true }));
    repo.findStoredMethodById.mockResolvedValue(createStoredPaymentMethod({ storedPaymentMethodId: 'spm1', isDefault: true }));
    useCase = new SaveStoredPaymentMethodUseCase(repo);
  });

  it('should save a stored payment method and set it as default', async () => {
    const result = await useCase.execute(
      new SaveStoredPaymentMethodCommand('c1', 'org1', 'card', 'stripe', 'tok_1', true, '4242', 'visa', 12, 2026),
    );

    expect(result.storedPaymentMethodId).toBe('spm1');
    expect(result.isDefault).toBe(true);
    expect(repo.setDefaultStoredMethod).toHaveBeenCalledWith('spm1', 'c1');
  });

  it('should throw FailedToCreateStoredPaymentMethodError when creation fails', async () => {
    repo.createStoredMethod.mockResolvedValueOnce(null);

    await expect(useCase.execute(new SaveStoredPaymentMethodCommand('c1', 'org1', 'card', 'stripe', 'tok_1'))).rejects.toThrow(
      FailedToCreateStoredPaymentMethodError,
    );
  });

  it('should not set a default when isDefault is false', async () => {
    repo.createStoredMethod.mockResolvedValueOnce(createStoredPaymentMethod({ storedPaymentMethodId: 'spm2', isDefault: false }));

    await useCase.execute(new SaveStoredPaymentMethodCommand('c1', 'org1', 'card', 'stripe', 'tok_2', false));

    expect(repo.setDefaultStoredMethod).not.toHaveBeenCalled();
  });

  it('should throw FailedToRetrieveSavedPaymentMethodError when the saved method cannot be re-read', async () => {
    repo.findStoredMethodById.mockResolvedValueOnce(null);

    await expect(useCase.execute(new SaveStoredPaymentMethodCommand('c1', 'org1', 'card', 'stripe', 'tok_1'))).rejects.toThrow(
      FailedToRetrieveSavedPaymentMethodError,
    );
  });
});
