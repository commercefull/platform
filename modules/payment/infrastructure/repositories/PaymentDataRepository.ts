/**
 * Consolidated Payment Data Repository
 *
 * Merges PaymentRepository and paymentRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Payment (core payment settings, stored methods, webhooks, gateways)
 */

import PaymentRepo from './PaymentRepository';
import paymentGatewayRepo from './paymentRepo';

class PaymentDataRepository {
  readonly payments = PaymentRepo;
  readonly gateways = paymentGatewayRepo;
}

export default new PaymentDataRepository();
