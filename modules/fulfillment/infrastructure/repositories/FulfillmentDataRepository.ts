/**
 * Consolidated Fulfillment Repository
 *
 * Merges fulfillment repositories into a single aggregate-aligned repository.
 *
 * Aggregate: Fulfillment
 */

import fulfillmentRepository from './FulfillmentRepository';
import adminOperationsRepo from './adminOperationsRepo';

class FulfillmentDataRepository {
  readonly fulfillments = fulfillmentRepository;
  readonly admin = adminOperationsRepo;
}

export default new FulfillmentDataRepository();
