/**
 * LoyaltyBalancePort
 *
 * ACL port owned by pricing. Provides read-only access to loyalty
 * points balance for price calculation.
 *
 * Only the adapter may import from loyalty's infrastructure.
 */

export interface LoyaltyBalancePort {
  getCustomerPoints(customerId: string): Promise<number>;
}
