import { lazyMock, createStoredPaymentMethod } from '../../tests/testUtils';
import { SaveStoredPaymentMethodUseCase, SaveStoredPaymentMethodCommand } from './SaveStoredPaymentMethod';
import { FailedToCreateStoredPaymentMethodError, FailedToRetrieveSavedPaymentMethodError } from '../../domain/errors/PaymentErrors';
import type { StoredPaymentMethodRepository } from '../../domain/repositories/StoredPaymentMethodRepository';

describe('SaveStoredPaymentMethodUseCase', () => {
  let useCase: SaveStoredPaymentMethodUseCase;
  let repo: jest.Mocked<StoredPaymentMethodRepository>;

  beforeEach(() => {
    repo = lazyMock<StoredPaymentMethodRepository>();
    repo.createStoredMethod.mockResolvedValue(createStoredPaymentMethod({ storedPaymentMethodId: 'spm1', isDefault: true }));
    repo.findStoredMethodById.mockResolvedValue(createStoredPaymentMethod({ storedPaymentMethodId: 'spm1', isDefault: true }));
    useCase = new SaveStoredPaymentMethodUseCase(repo);
  });

  it('should save a stored payment method and set it as default', async () => {
    const result = await useCase.execute(
      new SaveStoredPaymentMethodCommand({
        customerId: 'c1',
        organizationId: 'org1',
        type: 'card',
        provider: 'stripe',
        providerToken: 'tok_1',
        isDefault: true,
        last4: '4242',
        brand: 'visa',
        expiryMonth: 12,
        expiryYear: 2026,
      }),
    );

    expect(result.storedPaymentMethodId).toBe('spm1');
    expect(result.isDefault).toBe(true);
    expect(repo.setDefaultStoredMethod).toHaveBeenCalledWith('spm1', 'c1');
  });

  it('should throw FailedToCreateStoredPaymentMethodError when creation fails', async () => {
    repo.createStoredMethod.mockResolvedValueOnce(null);

    await expect(
      useCase.execute(
        new SaveStoredPaymentMethodCommand({
          customerId: 'c1',
          organizationId: 'org1',
          type: 'card',
          provider: 'stripe',
          providerToken: 'tok_1',
        }),
      ),
    ).rejects.toThrow(FailedToCreateStoredPaymentMethodError);
  });

  it('should not set a default when isDefault is false', async () => {
    repo.createStoredMethod.mockResolvedValueOnce(createStoredPaymentMethod({ storedPaymentMethodId: 'spm2', isDefault: false }));

    await useCase.execute(
      new SaveStoredPaymentMethodCommand({
        customerId: 'c1',
        organizationId: 'org1',
        type: 'card',
        provider: 'stripe',
        providerToken: 'tok_2',
        isDefault: false,
      }),
    );

    expect(repo.setDefaultStoredMethod).not.toHaveBeenCalled();
  });

  it('should throw FailedToRetrieveSavedPaymentMethodError when the saved method cannot be re-read', async () => {
    repo.findStoredMethodById.mockResolvedValueOnce(null);

    await expect(
      useCase.execute(
        new SaveStoredPaymentMethodCommand({
          customerId: 'c1',
          organizationId: 'org1',
          type: 'card',
          provider: 'stripe',
          providerToken: 'tok_1',
        }),
      ),
    ).rejects.toThrow(FailedToRetrieveSavedPaymentMethodError);
  });
});
