import { PaymentSettingsRepository, PaymentSettingsUpsertParams } from '../../domain/repositories/PaymentSettingsRepository';

export class ManagePaymentSettingsUseCase {
  constructor(
    private readonly paymentRepo: Pick<PaymentSettingsRepository, 'findAllSettings' | 'findSettingsByMerchant' | 'upsertSettings'>,
  ) {}

  async findAll() {
    return this.paymentRepo.findAllSettings();
  }
  async findByMerchant(organizationId: string) {
    return this.paymentRepo.findSettingsByMerchant(organizationId);
  }
  async upsert(params: PaymentSettingsUpsertParams) {
    return this.paymentRepo.upsertSettings(params);
  }
}
