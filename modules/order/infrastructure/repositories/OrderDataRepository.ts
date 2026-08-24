/**
 * Consolidated Order Data Repository
 *
 * Merges OrderRepository and OrderQueryRepository
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Order (core order data, queries, notes, payments, shipping, tax, discounts)
 */

import orderRepo from './OrderRepository';
import orderQueryRepo from './OrderQueryRepository';

class OrderDataRepository {
  readonly commands = orderRepo;
  readonly queries = orderQueryRepo;
}

export default new OrderDataRepository();
