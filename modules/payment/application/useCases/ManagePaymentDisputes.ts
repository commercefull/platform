import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';


export class ManagePaymentDisputesUseCase {
  constructor(private readonly billingRepo: PaymentBillingRepository) {}

  async findAll(status?: string, limit?: number) {
    return this.billingRepo.findAllDisputes(status, limit);
  }
  async findByPayment(paymentId: string) {
    return this.billingRepo.findDisputesByPayment(paymentId);
  }
  async findById(disputeId: string) {
    return this.billingRepo.findDisputeById(disputeId);
  }
  async updateStatus(disputeId: string, status: string, resolvedAt?: Date) {
    return this.billingRepo.updateDisputeStatus(disputeId, status, resolvedAt);
  }
}
