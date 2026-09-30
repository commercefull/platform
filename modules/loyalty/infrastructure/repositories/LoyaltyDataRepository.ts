/**
 * Consolidated Loyalty Repository
 *
 * Merges loyaltyRepo and storefrontLoyaltyRepo
 * into a single aggregate-aligned repository.
 *
 * Aggregate: Loyalty (points, rewards, transactions, storefront operations)
 */

import loyaltyRepo from './loyaltyRepo';
import storefrontLoyaltyRepo from './storefrontLoyaltyRepo';

// Re-export types for backward compatibility
export { LoyaltyPointsAction } from './loyaltyRepo';

class LoyaltyDataRepository {
  readonly points = loyaltyRepo;
  readonly storefront = storefrontLoyaltyRepo;
}

export default new LoyaltyDataRepository();
