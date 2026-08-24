/**
 * Consolidated Loyalty Repository
 *
 * Merges loyaltyRepo, customerLoyaltyTransactionRepo, storefrontLoyaltyRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Loyalty (points, rewards, transactions, storefront operations)
 */

import loyaltyRepo from './loyaltyRepo';
import customerLoyaltyTransactionRepo from './customerLoyaltyTransactionRepo';
import storefrontLoyaltyRepo from './storefrontLoyaltyRepo';

// Re-export types for backward compatibility
export { LoyaltyPointsAction } from './loyaltyRepo';

class LoyaltyDataRepository {
  readonly points = loyaltyRepo;
  readonly transactions = customerLoyaltyTransactionRepo;
  readonly storefront = storefrontLoyaltyRepo;
}

export default new LoyaltyDataRepository();
