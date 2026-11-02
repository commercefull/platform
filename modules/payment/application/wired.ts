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
import { getRules, incrementRuleTrigger, isBlacklisted } from '../infrastructure/repositories/fraudRepo';
import { GatewayWebhookAdapter } from '../infrastructure/services/GatewayWebhookAdapter';
import { ScreenForFraudUseCase } from './useCases/ScreenForFraud';
import CheckoutRepo from '../../checkout/infrastructure/repositories/CheckoutRepository';
import orderDataRepository from '../../order/infrastructure/repositories/OrderDataRepository';

const fraudRepo = { getRules, incrementRuleTrigger, isBlacklisted };

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
};

export const screenForFraudUseCase = new ScreenForFraudUseCase(fraudRepo);

export const orderStatusSyncAdapter = new CheckoutOrderStatusSyncAdapter(CheckoutRepo, orderDataRepository.commands);

export const gatewayWebhookPort = new GatewayWebhookAdapter();
