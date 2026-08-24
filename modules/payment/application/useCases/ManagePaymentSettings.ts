import { PaymentRepository, PaymentSettingsUpsertParams } from '../../domain/repositories/PaymentRepository';
import paymentDataRepository from '../../infrastructure/repositories/PaymentDataRepository';

const PaymentRepo = paymentDataRepository.payments;

export class ManagePaymentSettingsUseCase {
  constructor(
    private readonly paymentRepo: PaymentRepository = PaymentRepo,
  ) {}

  async findAll() {
    return this.paymentRepo.findAllSettings();
  }
  async upsert(params: PaymentSettingsUpsertParams) {
    return this.paymentRepo.upsertSettings(params);
  }
}
