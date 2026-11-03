import type { PaymentTransactionRepository } from '../../domain/repositories/PaymentTransactionRepository';
import type { PaymentRefundRepository } from '../../domain/repositories/PaymentRefundRepository';
import type { PaymentGatewayConfigRepository } from '../../domain/repositories/PaymentGatewayConfigRepository';
import type { StoredPaymentMethodRepository } from '../../domain/repositories/StoredPaymentMethodRepository';

export class ManagePaymentRecordsUseCase {
  constructor(
    private readonly transactions: Pick<
      PaymentTransactionRepository,
      'findTransactionsByCustomerId' | 'findTransactionsByOrderId' | 'findTransactionById' | 'deleteTransaction'
    >,
    private readonly refunds: Pick<PaymentRefundRepository, 'findRefundsByTransactionId'>,
    private readonly gatewayConfig: Pick<PaymentGatewayConfigRepository, 'getEnabledPaymentMethods' | 'getDefaultGateway'>,
    private readonly storedMethods: Pick<
      StoredPaymentMethodRepository,
      'findStoredMethodsByCustomer' | 'setDefaultStoredMethod' | 'softDeleteStoredMethod'
    >,
  ) {}

  async findTransactionsByCustomerId(...args: Parameters<PaymentTransactionRepository['findTransactionsByCustomerId']>) {
    return this.transactions.findTransactionsByCustomerId(...args);
  }
  async findTransactionsByOrderId(orderId: string) {
    return this.transactions.findTransactionsByOrderId(orderId);
  }
  async findTransactionById(transactionId: string) {
    return this.transactions.findTransactionById(transactionId);
  }
  async findRefundsByTransactionId(transactionId: string) {
    return this.refunds.findRefundsByTransactionId(transactionId);
  }
  async getEnabledPaymentMethods(...args: Parameters<PaymentGatewayConfigRepository['getEnabledPaymentMethods']>) {
    return this.gatewayConfig.getEnabledPaymentMethods(...args);
  }
  async getDefaultGateway(organizationId: string) {
    return this.gatewayConfig.getDefaultGateway(organizationId);
  }
  async findStoredMethodsByCustomer(customerId: string) {
    return this.storedMethods.findStoredMethodsByCustomer(customerId);
  }
  async setDefaultStoredMethod(storedPaymentMethodId: string, customerId: string) {
    return this.storedMethods.setDefaultStoredMethod(storedPaymentMethodId, customerId);
  }
  async softDeleteStoredMethod(storedPaymentMethodId: string, customerId?: string) {
    return this.storedMethods.softDeleteStoredMethod(storedPaymentMethodId, customerId);
  }
  async deleteTransaction(transactionId: string) {
    return this.transactions.deleteTransaction(transactionId);
  }
}
