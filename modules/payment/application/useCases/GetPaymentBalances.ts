import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';


export class GetPaymentBalancesUseCase {
  constructor(private readonly billingRepo: PaymentBillingRepository) {}

  async findAll() {
    return this.billingRepo.findAllBalances();
  }
}
