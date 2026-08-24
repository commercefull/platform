import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const paymentBillingRepo = paymentBillingDataRepository.billing;

export class ManagePaymentFeesUseCase {
  constructor(
    private readonly billingRepo: PaymentBillingRepository = paymentBillingRepo,
  ) {}

  async findAll(limit?: number) {
    return this.billingRepo.findAllFees(limit);
  }
}
