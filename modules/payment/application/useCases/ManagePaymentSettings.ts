import { PaymentRepository, PaymentSettingsUpsertParams } from '../../domain/repositories/PaymentRepository';


export class ManagePaymentSettingsUseCase {
  constructor(private readonly paymentRepo: PaymentRepository) {}

  async findAll() {
    return this.paymentRepo.findAllSettings();
  }
  async upsert(params: PaymentSettingsUpsertParams) {
    return this.paymentRepo.upsertSettings(params);
  }
}
