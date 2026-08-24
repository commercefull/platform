/**
 * Consolidated Fulfillment Repository
 *
 * Merges FulfillmentRepository, adminOperationsRepo, fulfillmentRuleRepo,
 * fulfillmentNetworkRuleRepo into a single aggregate-aligned repository.
 *
 * Aggregate: Fulfillment (fulfillments, operations, rules, network rules)
 */

import fulfillmentRepository from './FulfillmentRepository';
import adminOperationsRepo from './adminOperationsRepo';
import fulfillmentRuleRepo from './fulfillmentRuleRepo';
import fulfillmentNetworkRuleRepo from './fulfillmentNetworkRuleRepo';

class FulfillmentDataRepository {
  readonly fulfillments = fulfillmentRepository;
  readonly admin = adminOperationsRepo;
  readonly rules = fulfillmentRuleRepo;
  readonly networkRules = fulfillmentNetworkRuleRepo;
}

export default new FulfillmentDataRepository();
