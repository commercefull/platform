import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';


export class ManagePaymentFeesUseCase {
  constructor(private readonly billingRepo: PaymentBillingRepository) {}

  async findAll(limit?: number) {
    return this.billingRepo.findAllFees(limit);
  }
}
