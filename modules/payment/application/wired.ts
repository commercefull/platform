import paymentDataRepository from '../infrastructure/repositories/PaymentDataRepository';
import { CheckoutOrderStatusSyncAdapter } from '../infrastructure/acl/CheckoutOrderStatusSyncAdapter';
import paymentBillingDataRepository from '../infrastructure/repositories/PaymentBillingDataRepository';
import type {
  FraudRule,
  RuleType,
  RuleAction,
  CheckStatus,
  BlacklistType,
  RiskLevel,
} from '../infrastructure/repositories/PaymentBillingDataRepository';
import { FraudRepo, FraudRepo as fraudRepo } from '../infrastructure';
import { FraudScreeningService } from './services/FraudScreeningService';
import CheckoutRepo from '../../checkout/infrastructure/repositories/CheckoutRepository';
import orderDataRepository from '../../order/infrastructure/repositories/OrderDataRepository';

export {
  paymentDataRepository,
  CheckoutOrderStatusSyncAdapter,
  paymentBillingDataRepository,
  FraudRule,
  RuleType,
  RuleAction,
  CheckStatus,
  BlacklistType,
  RiskLevel,
  fraudRepo,
  FraudRepo,
};

export const fraudScreeningService = new FraudScreeningService(FraudRepo);

export const orderStatusSyncAdapter = new CheckoutOrderStatusSyncAdapter(
  CheckoutRepo,
  orderDataRepository.commands,
);
