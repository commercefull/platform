/**
 * Storefront Loyalty Repository Port
 *
 * Domain interface for the storefront loyalty read model — row-level
 * projections (points balance aliases, joined tier fields) served to
 * storefront pages. Point mutations go through LoyaltyPointsRepository.
 */

export interface StorefrontLoyaltyRepository {
  findMemberWithTier(customerId: string): Promise<unknown | null>;
  findCustomerTransactions(customerId: string, limit: number, offset: number): Promise<unknown[]>;
  countCustomerTransactions(customerId: string): Promise<number>;
  findAvailableRewards(pointsBalance: number): Promise<unknown[]>;
  findRewardById(rewardId: string): Promise<unknown | null>;
  findMemberByCustomerId(customerId: string): Promise<unknown | null>;
}
