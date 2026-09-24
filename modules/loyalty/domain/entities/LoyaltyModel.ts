/**
 * Database record types — match the generated libs/db/types schema.
 * Kept in domain so repository ports do not depend on the database layer.
 */

export type LoyaltyTier = {
  tierId: string;
  programId: string | null;
  name: string;
  description: string | null;
  level: number;
  pointsThreshold: number;
  purchasesThreshold: number | null;
  pointsMultiplier: string | null;
  benefits: unknown[] | null;
  iconUrl: string | null;
  color: string | null;
  isActive: boolean | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type LoyaltyPoints = {
  loyaltyPointsId: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  tierId: string;
  currentPoints: number;
  lifetimePoints: number;
  lastActivity: Date;
  expiryDate: Date | null;
}

export type LoyaltyTransaction = {
  loyaltyTransactionId: string;
  createdAt: Date;
  updatedAt: Date;
  customerId: string;
  orderId: string | null;
  action: string;
  points: number;
  description: string | null;
  referenceId: string | null;
}

export type LoyaltyReward = {
  rewardId: string;
  programId: string | null;
  name: string;
  description: string | null;
  type: string;
  pointsCost: number;
  value: string | null;
  valueType: string | null;
  productId: string | null;
  categoryId: string | null;
  minOrderValueCents: number | null;
  maxUsagePerCustomer: number | null;
  totalQuantity: number | null;
  remainingQuantity: number | null;
  redemptionExpiryDays: number | null;
  validFrom: Date | null;
  validTo: Date | null;
  isActive: boolean | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export type LoyaltyRedemption = {
  redemptionId: string;
  customerId: string;
  rewardId: string;
  orderId: string | null;
  pointsSpent: number;
  status: string | null;
  couponCode: string | null;
  redeemedAt: Date;
  expiresAt: Date | null;
  usedAt: Date | null;
  metadata: Record<string, unknown> | null;
}

