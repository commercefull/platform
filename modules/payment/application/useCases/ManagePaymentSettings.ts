import { PaymentRepository, PaymentSettingsUpsertParams } from '../../domain/repositories/PaymentRepository';


export class ManagePaymentSettingsUseCase {
  constructor(private readonly paymentRepo: PaymentRepository) {}

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
