/**
 * Consolidated Payment Data Repository
 *
 * Exposes the per-area repository implementations.
 */

import transactionRepo from './PaymentTransactionRepositoryImpl';
import refundRepo from './PaymentRefundRepositoryImpl';
import gatewayConfigRepo from './PaymentGatewayConfigRepositoryImpl';
import { paymentSettingsRepo, paymentWebhookRepo, storedPaymentMethodRepo } from './PaymentSettingsRepositoryImpl';
import paymentGatewayRepo from './paymentRepo';

class PaymentDataRepository {
  readonly transactions = transactionRepo;
  readonly refunds = refundRepo;
  readonly gatewayConfig = gatewayConfigRepo;
  readonly settings = paymentSettingsRepo;
  readonly webhooks = paymentWebhookRepo;
  readonly storedMethods = storedPaymentMethodRepo;
  readonly gateways = paymentGatewayRepo;
}

export default new PaymentDataRepository();
