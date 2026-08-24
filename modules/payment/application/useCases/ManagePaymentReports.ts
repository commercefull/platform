import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';
import paymentBillingDataRepository from '../../infrastructure/repositories/PaymentBillingDataRepository';

const paymentBillingRepo = paymentBillingDataRepository.billing;

export class ManagePaymentReportsUseCase {
  constructor(
    private readonly billingRepo: PaymentBillingRepository = paymentBillingRepo,
  ) {}

  async findAll(limit?: number) {
    return this.billingRepo.findAllReports(limit);
  }
  async findById(reportId: string) {
    return this.billingRepo.findReportById(reportId);
  }
}
