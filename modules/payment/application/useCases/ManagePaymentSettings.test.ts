jest.mock('../../infrastructure/repositories/PaymentDataRepository', () => ({
  __esModule: true,
  default: {
    payments: {
      findAllSettings: jest.fn().mockResolvedValue([{ settingId: 's1' }]),
      upsertSettings: jest.fn().mockResolvedValue(undefined),
    },
    gateways: {},
  },
}));

import { ManagePaymentSettingsUseCase } from './ManagePaymentSettings';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const mockRepo = paymentDataRepository as unknown as { payments: Record<string, jest.Mock> };

describe('ManagePaymentSettingsUseCase', () => {
  let useCase: ManagePaymentSettingsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ManagePaymentSettingsUseCase();
  });

  it('should find all settings', async () => {
    const result = await useCase.findAll();
    expect(result).toHaveLength(1);
  });

  it('should upsert settings', async () => {
    await useCase.upsert({ key: 'auto_capture', value: 'true' } as never);
    expect(mockRepo.payments.upsertSettings).toHaveBeenCalled();
  });
});
