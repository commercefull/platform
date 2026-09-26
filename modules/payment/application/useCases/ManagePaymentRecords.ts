import type { PaymentRepository } from '../../domain/repositories/PaymentRepository';

export class ManagePaymentRecordsUseCase {
  constructor(private readonly paymentRepo: PaymentRepository) {}

  async findTransactionsByCustomerId(...args: Parameters<PaymentRepository['findTransactionsByCustomerId']>) {
    return this.paymentRepo.findTransactionsByCustomerId(...args);
  }
  async findTransactionsByOrderId(orderId: string) {
    return this.paymentRepo.findTransactionsByOrderId(orderId);
  }
  async findTransactionById(transactionId: string) {
    return this.paymentRepo.findTransactionById(transactionId);
  }
  async findRefundsByTransactionId(transactionId: string) {
    return this.paymentRepo.findRefundsByTransactionId(transactionId);
  }
  async getEnabledPaymentMethods(...args: Parameters<PaymentRepository['getEnabledPaymentMethods']>) {
    return this.paymentRepo.getEnabledPaymentMethods(...args);
  }
  async getDefaultGateway(organizationId: string) {
    return this.paymentRepo.getDefaultGateway(organizationId);
  }
  async findStoredMethodsByCustomer(customerId: string) {
    return this.paymentRepo.findStoredMethodsByCustomer(customerId);
  }
  async setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string) {
    return this.paymentRepo.setDefaultStoredMethod(storedPaymentMethodId, customerId);
  }
  async softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string) {
    return this.paymentRepo.softDeleteStoredMethod(storedPaymentMethodId, customerId);
  }
  async deleteTransaction(transactionId: string) {
    return this.paymentRepo.deleteTransaction(transactionId);
  }
}
