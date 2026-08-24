import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const paymentBillingRepo = paymentBillingDataRepository.billing;

export class ManagePaymentDisputesUseCase {
  constructor(
    private readonly billingRepo: PaymentBillingRepository = paymentBillingRepo,
  ) {}

  async findAll(status?: string, limit?: number) {
    return this.billingRepo.findAllDisputes(status, limit);
  }
  async findById(disputeId: string) {
    return this.billingRepo.findDisputeById(disputeId);
  }
  async updateStatus(disputeId: string, status: string, resolvedAt?: Date) {
    return this.billingRepo.updateDisputeStatus(disputeId, status, resolvedAt);
  }
}
