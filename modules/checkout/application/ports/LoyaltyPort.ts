/**
 * LoyaltyPort
 *
 * ACL ports owned by checkout. Loyalty points are quoted at apply time and
 * debited at the payment boundary once an order exists (idempotent per
 * orderId). Points are restored through the loyalty module's
 * order.cancelled handler when the order is cancelled.
 */

export interface LoyaltyRewardQuote {
  rewardId: string;
  name: string;
  pointsCost: number;
  /** Discount value — cents when valueType is fixed/amountCents, percent when percentage/percent. */
  value?: number | null;
  valueType?: string | null;
  isActive: boolean;
}

export interface LoyaltyQuotePort {
  /** Available points balance; null when the customer is not a member. */
  getPointsBalance(customerId: string): Promise<number | null>;
  getReward(rewardId: string): Promise<LoyaltyRewardQuote | null>;
}

export interface LoyaltyRedemptionPort {
  /** Debits points against an order. Must be idempotent per orderId. */
  redeemPoints(input: { customerId: string; points: number; orderId: string; rewardId?: string }): Promise<{ transactionId: string }>;
}
