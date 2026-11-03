import { lazyMock, createPaymentSettings } from '../../tests/testUtils';
import { ManagePaymentSettingsUseCase } from './ManagePaymentSettings';
import type { PaymentSettingsRepository, PaymentSettingsUpsertParams } from '../../domain/repositories/PaymentSettingsRepository';

describe('ManagePaymentSettingsUseCase', () => {
  let useCase: ManagePaymentSettingsUseCase;
  let repo: jest.Mocked<PaymentSettingsRepository>;

  beforeEach(() => {
    repo = lazyMock<PaymentSettingsRepository>();
    useCase = new ManagePaymentSettingsUseCase(repo);
  });

  it('should find all settings', async () => {
    repo.findAllSettings.mockResolvedValue([createPaymentSettings()]);

    const result = await useCase.findAll();

    expect(result).toHaveLength(1);
  });

  it('should upsert settings', async () => {
    repo.upsertSettings.mockResolvedValue(createPaymentSettings());
    const params = { organizationId: 'org1', capturePaymentsAutomatically: true };

    await useCase.upsert(params as unknown as PaymentSettingsUpsertParams);

    expect(repo.upsertSettings).toHaveBeenCalledWith(params);
  });
});
