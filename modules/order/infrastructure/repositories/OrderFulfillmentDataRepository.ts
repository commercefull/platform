/**
 * Consolidated Order Fulfillment Repository
 *
 * Merges orderFulfillmentRepo and orderReturnRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Order Fulfillment (fulfillments, packages, returns)
 */

import orderFulfillmentRepo from './orderFulfillmentRepo';
import orderReturnRepo from './orderReturnRepo';

class OrderFulfillmentDataRepository {
  readonly fulfillments = orderFulfillmentRepo;
  readonly returns = orderReturnRepo;
}

export default new OrderFulfillmentDataRepository();
