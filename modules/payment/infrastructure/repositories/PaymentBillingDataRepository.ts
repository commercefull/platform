/**
 * Consolidated Payment Billing Repository
 *
 * Merges PaymentBillingRepository and fraudRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Payment Billing (billing, fees, disputes, reports, fraud rules/checks/blacklist)
 */

import paymentBillingRepo from './PaymentBillingRepository';
import {
  addToBlacklist,
  createCheck,
  deleteRule,
  expireBlacklistEntries,
  getBlacklist,
  getBlacklistEntry,
  getCheck,
  getCheckByOrderId,
  getChecks,
  getPendingReviews,
  getRule,
  getRules,
  incrementRuleTrigger,
  isBlacklisted,
  removeFromBlacklist,
  reviewCheck,
  runFraudCheck,
  saveRule,
} from './fraudRepo';
const fraudRepo = {
  addToBlacklist,
  createCheck,
  deleteRule,
  expireBlacklistEntries,
  getBlacklist,
  getBlacklistEntry,
  getCheck,
  getCheckByOrderId,
  getChecks,
  getPendingReviews,
  getRule,
  getRules,
  incrementRuleTrigger,
  isBlacklisted,
  removeFromBlacklist,
  reviewCheck,
  runFraudCheck,
  saveRule,
};
// Re-export fraud types for backward compatibility
export type { RuleType, RuleAction, CheckStatus, RiskLevel, BlacklistType, FraudRule, FraudCheck, FraudBlacklist } from './fraudRepo';

class PaymentBillingDataRepository {
  readonly billing = paymentBillingRepo;
  readonly fraud = fraudRepo;
}

export default new PaymentBillingDataRepository();
