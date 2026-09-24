import { PaymentBillingRepository } from '../../domain/repositories/PaymentBillingRepository';


export class ManagePaymentReportsUseCase {
  constructor(private readonly billingRepo: PaymentBillingRepository) {}

  async findAll(limit?: number) {
    return this.billingRepo.findAllReports(limit);
  }
  async findById(reportId: string) {
    return this.billingRepo.findReportById(reportId);
  }
}
