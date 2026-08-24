import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const paymentBillingRepo = paymentBillingDataRepository.billing;

export class GetPaymentBalancesUseCase {
  constructor(
    private readonly billingRepo: PaymentBillingRepository = paymentBillingRepo,
  ) {}

  async findAll() {
    return this.billingRepo.findAllBalances();
  }
}
